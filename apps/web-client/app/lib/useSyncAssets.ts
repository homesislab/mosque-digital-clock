'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MosqueConfig, SyncEvent } from '@mosque-digital-clock/shared-types';
import { getApiBaseUrl, resolveUrl } from './constants';

const AUDIO_CACHE_NAME = 'audio-cache';
const IMAGE_CACHE_NAME = 'image-cache';

export function useSyncAssets(config: MosqueConfig | null) {
    const [status, setStatus] = useState<'sync' | 'unsync' | 'syncing'>('sync');
    const [progress, setProgress] = useState(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSyncInProgress = useRef(false);

    const extractAssets = useCallback((conf: MosqueConfig) => {
        const audioUrlsArr = new Set<string>();
        const imageUrlsArr = new Set<string>();
        
        // 1. Core Prayer / Iqamah / Imsak (Audio)
        if (conf.iqamah?.audioUrl) audioUrlsArr.add(resolveUrl(conf.iqamah.audioUrl));
        if (conf.adzan?.audioUrl) audioUrlsArr.add(resolveUrl(conf.adzan.audioUrl));
        if (conf.ramadhan?.imsakAudioUrl) audioUrlsArr.add(resolveUrl(conf.ramadhan.imsakAudioUrl));
        
        // 2. Playlists (Audio)
        conf.audio?.playlists?.forEach(playlist => {
            playlist.tracks.forEach(track => {
                if (track.url) audioUrlsArr.add(resolveUrl(track.url));
            });
        });

        // 3. Global & Test URLs (Audio)
        if (conf.audio?.globalUrl) audioUrlsArr.add(resolveUrl(conf.audio.globalUrl));
        if (conf.audioTest?.url) audioUrlsArr.add(resolveUrl(conf.audioTest.url));

        // 4. Slideshow Images
        conf.sliderImages?.forEach(url => imageUrlsArr.add(resolveUrl(url)));
        
        // 5. Logo
        if (conf.mosqueInfo?.logoUrl) imageUrlsArr.add(resolveUrl(conf.mosqueInfo.logoUrl));

        return {
            audio: Array.from(audioUrlsArr).filter(url => !!url),
            images: Array.from(imageUrlsArr).filter(url => !!url)
        };
    }, []);

    const syncAssets = useCallback(async (conf: MosqueConfig) => {
        if (!conf || isSyncInProgress.current) return;
        
        isSyncInProgress.current = true;
        console.log('[Sync] Starting synchronization for version:', conf.version);
        setStatus('syncing');
        setProgress(0);

        try {
            const assets = extractAssets(conf);
            const total = assets.audio.length + assets.images.length;
            let completed = 0;
            let allOk = true;
            
            const audioCache = await caches.open(AUDIO_CACHE_NAME);
            const imageCache = await caches.open(IMAGE_CACHE_NAME);
            
            // Unduh 1 file dengan retry + dukungan lintas-origin (opaque) supaya
            // audio CDN tetap ter-cache di jaringan labil. Return true HANYA bila
            // file benar-benar ada di cache sesudahnya.
            const downloadOne = async (url: string, cache: Cache): Promise<boolean> => {
                if (await cache.match(url)) return true;
                let crossOrigin = false;
                try { crossOrigin = new URL(url, location.href).origin !== location.origin; } catch {}
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const fetchRes = await fetch(url, crossOrigin
                            ? { cache: 'no-cache', mode: 'no-cors' }
                            : { cache: 'no-cache' });
                        // status 0 = opaque (no-cors) response; tetap bisa di-cache & diputar
                        if (fetchRes.ok || fetchRes.type === 'opaque') {
                            await cache.put(url, fetchRes.clone());
                            if (await cache.match(url)) return true;
                        }
                    } catch (err) {
                        console.warn(`[Sync] Percobaan ${attempt + 1} gagal: ${url}`, err);
                    }
                    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
                }
                return false;
            };

            // Sync Helper
            const downloadToCache = async (urls: string[], cache: Cache) => {
                for (const url of urls) {
                    const ok = await downloadOne(url, cache);
                    if (!ok) allOk = false;
                    completed++;
                    if (total > 0) setProgress(Math.round((completed / total) * 100));
                }
            };

            // Download Audio then Images
            await downloadToCache(assets.audio, audioCache);
            await downloadToCache(assets.images, imageCache);

            // GC Helper
            const cleanupCache = async (validUrls: string[], cache: Cache) => {
                const keys = await cache.keys();
                for (const request of keys) {
                    if (!validUrls.includes(request.url)) {
                        console.log(`[Sync] GC: Removing obsolete asset ${request.url}`);
                        await cache.delete(request);
                    }
                }
            };

            await cleanupCache(assets.audio, audioCache);
            await cleanupCache(assets.images, imageCache);

            if (allOk) {
                localStorage.setItem('syncedAudioVersion', String(conf.version));
                console.log('[Sync] Assets are now synchronized.');
            } else {
                // Jangan tandai versi tersinkron bila ada file gagal — biarkan
                // effect "heal" / event online mencoba lagi saat jaringan membaik.
                console.warn('[Sync] Sebagian aset gagal di-cache; akan dicoba lagi saat jaringan stabil.');
            }
            setStatus('sync');
        } catch (err) {
            console.warn('[Sync] Sync gracefully aborted/failed:', err);
            // Hide the error indicator on the client UI to prevent disruption
            setStatus('sync');
        } finally {
            isSyncInProgress.current = false;
        }
    }, [extractAssets]);

    // Check version on config change
    useEffect(() => {
        if (!config) return;
        const syncedVersion = Number(localStorage.getItem('syncedAudioVersion') || '0');
        if (config.version > syncedVersion && !isSyncInProgress.current) {
            syncAssets(config);
        }
    }, [config, syncAssets]);

    // Heal aset yang hilang walau versi sudah sama, dan coba lagi saat jaringan
    // kembali. Memperbaiki perangkat berjaringan labil yang sync awalnya hanya
    // sebagian (sebagian audio tak pernah ter-cache → pemutaran gagal).
    useEffect(() => {
        if (!config) return;
        let cancelled = false;

        const healIfNeeded = async () => {
            if (isSyncInProgress.current) return;
            try {
                const assets = extractAssets(config);
                const audioCache = await caches.open(AUDIO_CACHE_NAME);
                for (const url of assets.audio) {
                    if (!url) continue;
                    if (!(await audioCache.match(url))) {
                        if (!cancelled) syncAssets(config);
                        return;
                    }
                }
            } catch (e) {
                // best effort — abaikan
            }
        };

        const onOnline = () => healIfNeeded();
        window.addEventListener('online', onOnline);
        healIfNeeded();

        return () => {
            cancelled = true;
            window.removeEventListener('online', onOnline);
        };
    }, [config, extractAssets, syncAssets]);

    // SSE Real-time Listener — with exponential backoff & offline awareness
    useEffect(() => {
        const baseUrl = getApiBaseUrl();
        const mosqueKey = localStorage.getItem('mosqueKey') || 'default';
        const deviceId = localStorage.getItem('deviceId') || 'unknown';
        const sseUrl = `${baseUrl}/api/events?key=${mosqueKey}&deviceId=${deviceId}`;

        let retryDelay = 5_000;          // Start at 5s
        const MAX_DELAY = 60_000;        // Cap at 60s
        let isDestroyed = false;

        const scheduleReconnect = () => {
            if (isDestroyed) return;

            // If offline, don't hammer — wait for the browser online event instead
            if (!navigator.onLine) {
                console.log('[SSE] Offline detected — waiting for network before reconnect...');
                window.addEventListener('online', connectOnce, { once: true });
                return;
            }

            console.log(`[SSE] Reconnecting in ${retryDelay / 1000}s...`);
            reconnectTimeoutRef.current = setTimeout(() => {
                retryDelay = Math.min(retryDelay * 2, MAX_DELAY); // exponential backoff
                connect();
            }, retryDelay);
        };

        const connect = () => {
            if (isDestroyed) return;
            if (eventSourceRef.current) eventSourceRef.current.close();

            console.log('[SSE] Connecting to', sseUrl);
            const es = new EventSource(sseUrl);
            eventSourceRef.current = es;

            es.onopen = () => {
                retryDelay = 5_000; // Reset backoff on successful connection
                console.log('[SSE] Connected.');
            };

            es.onmessage = (event) => {
                try {
                    const data: SyncEvent = JSON.parse(event.data);
                    if (data.type === 'CONFIG_UPDATED') {
                        console.log('[SSE] Config update detected. Refreshing...');
                        window.dispatchEvent(new CustomEvent('config-refresh-needed'));
                    }
                } catch (e) {}
            };

            es.onerror = () => {
                es.close();
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                scheduleReconnect();
            };
        };

        // Wrapper for the online event listener (used once when back online)
        const connectOnce = () => {
            retryDelay = 5_000; // Reset backoff when coming back online
            connect();
        };

        connect();

        return () => {
            isDestroyed = true;
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            window.removeEventListener('online', connectOnce);
        };
    }, []);

    return { status, progress };
}
