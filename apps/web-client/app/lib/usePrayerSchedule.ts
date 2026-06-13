'use client';

/**
 * usePrayerSchedule
 * ------------------
 * Daily prayer schedule sourced DIRECTLY from a central prayer-time provider
 * (api.myquran.com — Kemenag schedule per kota), with offline fallback.
 *
 * Flow (sesuai arsitektur):
 *  1. Client mengambil jadwal solat HARIAN langsung ke pusat waktu shalat.
 *  2. Hasilnya di-cache (localStorage) sebagai fallback offline.
 *  3. Jika fetch gagal & tidak ada cache, fallback ke perhitungan lokal (adhan).
 *
 * Re-fetch terjadi: saat mount, saat config berubah (version/cityId),
 * saat pergantian hari (date rollover), dan saat jaringan kembali online.
 */

import { useEffect, useState } from 'react';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { getPrayerTimes } from './prayer-times';

const MYQURAN_BASE = 'https://api.myquran.com/v2';

export type PrayerSource = 'central' | 'cache' | 'local';

export interface PrayerScheduleResult {
    imsak: Date;
    subuh: Date;
    syuruq: Date;
    dzuhur: Date;
    jumat: Date;
    ashar: Date;
    maghrib: Date;
    isya: Date;
}

interface MyQuranJadwal {
    imsak: string;
    subuh: string;
    terbit: string;
    dhuha?: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    date?: string;
    tanggal?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addMin = (d: Date, m = 0) => new Date(d.getTime() + (m || 0) * 60000);
const cacheKeyFor = (cityId: string, key: string) => `prayerJadwal:${cityId}:${key}`;

/** Parse "HH:MM" (tolerant of suffixes like " WIB") onto the given base date. */
function parseHHMM(value: string | undefined, base: Date): Date | null {
    if (!value) return null;
    const m = value.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const hours = Number(m[1]);
    const minutes = Number(m[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    const d = new Date(base);
    d.setHours(hours, minutes, 0, 0);
    return d;
}

/** Build the same shape as getPrayerTimes() from a central-source jadwal + config adjustments. */
export function buildScheduleFromJadwal(
    jadwal: MyQuranJadwal,
    config: MosqueConfig,
    base: Date,
): PrayerScheduleResult | null {
    const subuhRaw = parseHHMM(jadwal.subuh, base);
    const dzuhurRaw = parseHHMM(jadwal.dzuhur, base);
    const asharRaw = parseHHMM(jadwal.ashar, base);
    const maghribRaw = parseHHMM(jadwal.maghrib, base);
    const isyaRaw = parseHHMM(jadwal.isya, base);
    const imsakRaw = parseHHMM(jadwal.imsak, base);
    const terbitRaw = parseHHMM(jadwal.terbit, base);

    if (!subuhRaw || !dzuhurRaw || !asharRaw || !maghribRaw || !isyaRaw) return null;

    const adj = (config.prayerTimes?.adjustments || {}) as Record<string, number>;
    const imsakOffset = (config as any)?.ramadhan?.imsakOffset || 10;

    return {
        imsak: imsakRaw ? addMin(imsakRaw, adj.subuh) : addMin(addMin(subuhRaw, adj.subuh), -imsakOffset),
        subuh: addMin(subuhRaw, adj.subuh),
        syuruq: terbitRaw || subuhRaw,
        dzuhur: addMin(dzuhurRaw, adj.dzuhur),
        jumat: addMin(dzuhurRaw, adj.jumat ?? adj.dzuhur),
        ashar: addMin(asharRaw, adj.ashar),
        maghrib: addMin(maghribRaw, adj.maghrib),
        isya: addMin(isyaRaw, adj.isya),
    };
}

export function usePrayerSchedule(config: MosqueConfig | null) {
    const [schedule, setSchedule] = useState<PrayerScheduleResult | null>(null);
    const [source, setSource] = useState<PrayerSource | null>(null);

    const cityId = (config?.prayerTimes as any)?.cityId as string | undefined;
    const version = config?.version;

    useEffect(() => {
        if (!config) return;
        let cancelled = false;
        let currentDay = dateKey(new Date());

        const applyLocal = (base: Date) => {
            const local = getPrayerTimes(config, base);
            if (local && !cancelled) {
                setSchedule(local as PrayerScheduleResult);
                setSource('local');
            }
        };

        const load = async (base: Date) => {
            // No central kota configured -> local adhan calculation
            if (!cityId) {
                applyLocal(base);
                return;
            }

            const key = dateKey(base);

            // 1. Render instantly from cache (offline-first)
            let hadCache = false;
            try {
                const cached = localStorage.getItem(cacheKeyFor(cityId, key));
                if (cached) {
                    const built = buildScheduleFromJadwal(JSON.parse(cached), config, base);
                    if (built && !cancelled) {
                        setSchedule(built);
                        setSource('cache');
                        hadCache = true;
                    }
                }
            } catch {
                /* ignore corrupt cache */
            }

            // 2. Fetch fresh directly from the central source (myQuran / Kemenag)
            try {
                const url = `${MYQURAN_BASE}/sholat/jadwal/${encodeURIComponent(cityId)}/${base.getFullYear()}/${pad(
                    base.getMonth() + 1,
                )}/${pad(base.getDate())}`;
                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) {
                    const json = await res.json();
                    const jadwal: MyQuranJadwal | undefined = json?.data?.jadwal;
                    if (jadwal) {
                        try {
                            localStorage.setItem(cacheKeyFor(cityId, key), JSON.stringify(jadwal));
                        } catch {
                            /* storage full — ignore */
                        }
                        const built = buildScheduleFromJadwal(jadwal, config, base);
                        if (built && !cancelled) {
                            setSchedule(built);
                            setSource('central');
                        }
                        // GC stale cached days for this kota
                        try {
                            const keep = cacheKeyFor(cityId, key);
                            const prefix = `prayerJadwal:${cityId}:`;
                            for (let i = localStorage.length - 1; i >= 0; i--) {
                                const k = localStorage.key(i);
                                if (k && k.startsWith(prefix) && k !== keep) localStorage.removeItem(k);
                            }
                        } catch {
                            /* ignore */
                        }
                        return;
                    }
                }
            } catch (err) {
                console.warn('[PrayerSchedule] Central fetch failed, using fallback:', err);
            }

            // 3. Final fallback: local calculation (only if cache did not already render)
            if (!hadCache) applyLocal(base);
        };

        load(new Date());

        // Daily refresh on date rollover
        const interval = setInterval(() => {
            const today = dateKey(new Date());
            if (today !== currentDay) {
                currentDay = today;
                load(new Date());
            }
        }, 60_000);

        // Refresh when the network comes back
        const onOnline = () => load(new Date());
        window.addEventListener('online', onOnline);

        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener('online', onOnline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cityId, version]);

    return { schedule, source };
}
