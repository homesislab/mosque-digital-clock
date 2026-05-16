'use client';

import { useState, useEffect } from 'react';
import { getPrayerTimes, formatTime } from '../lib/prayer-times';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

interface PrayerTimesProps {
    config: MosqueConfig;
    nextPrayer?: string;
    secondsRemaining?: number;
}

export const PrayerTimes = ({ config, nextPrayer, secondsRemaining }: PrayerTimesProps) => {
    const [times, setTimes] = useState<any>(null);

    useEffect(() => {
        const calculated = getPrayerTimes(config);
        setTimes(calculated);

        // Refresh logic...
    }, [config]);

    if (!times) return null;

    const isFriday = new Date().getDay() === 5;
    const prayers = [
        ...(config.ramadhan?.enabled ? [{ name: 'Imsak', time: formatTime(times.imsak) }] : []),
        { name: 'Subuh', time: formatTime(times.subuh) },
        { name: 'Syuruq', time: formatTime(times.syuruq) },
        { name: isFriday ? 'Jumat' : 'Dzuhur', time: formatTime(times.jumat || times.dzuhur) },
        { name: 'Ashar', time: formatTime(times.ashar) },
        { name: 'Maghrib', time: formatTime(times.maghrib) },
        { name: 'Isya', time: formatTime(times.isya) },
    ];

    const adv = config.advancedDisplay;
    const blurAmount = adv?.prayerTimesBlur || 0;

    return (
        <div
            className="flex flex-row items-center justify-center gap-4 w-full h-full"
            style={{ 
                opacity: adv?.prayerTimesOpacity ?? 1,
            }}
            role="list"
            aria-label="Jadwal waktu sholat"
        >
            {prayers.map((prayer, index) => {
                const isActive = nextPrayer?.toLowerCase() === prayer.name.toLowerCase();

                const itemStyle: React.CSSProperties = {
                    backgroundColor: isActive 
                        ? (adv?.prayerTimesActiveBgColor || undefined) 
                        : (adv?.prayerTimesBgColor || undefined),
                    color: isActive 
                        ? (adv?.prayerTimesActiveTextColor || undefined) 
                        : (adv?.prayerTimesTextColor || undefined),
                    borderColor: isActive 
                        ? (adv?.prayerTimesActiveColor || undefined) 
                        : undefined,
                    backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none'
                };

                return (
                    <div
                        key={prayer.name}
                        className={`
                            relative flex-1 flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 shadow-sm
                            ${isActive
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-md ring-4 ring-emerald-50 active-prayer-glow'
                                : 'bg-white border border-slate-200'}
                        `}
                        style={itemStyle}
                        role="listitem"
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={`${prayer.name}: ${prayer.time}${isActive ? ' (sholat berikutnya)' : ''}`}
                    >
                        <span
                            className={`text-sm lg:text-[20px] uppercase font-semibold mb-1 ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}
                            style={{ color: isActive ? adv?.prayerTimesActiveTextColor : adv?.prayerTimesTextColor }}
                            aria-hidden="true"
                        >
                            {prayer.name}
                        </span>
                        <span
                            className={`text-2xl lg:text-[32px] font-bold font-mono tracking-tighter tabular-nums ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}
                            style={{ color: isActive ? adv?.prayerTimesActiveTextColor : adv?.prayerTimesTextColor }}
                            aria-hidden="true"
                        >
                            {prayer.time}
                        </span>

                        {isActive && secondsRemaining !== undefined && secondsRemaining > 0 && adv?.showNextPrayerCountdown !== false && (
                            <div
                                className="mt-2 bg-emerald-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse tracking-widest"
                                style={{ color: adv?.prayerTimesActiveColor || undefined }}
                                aria-hidden="true"
                            >
                                -{new Date(secondsRemaining * 1000).toISOString().substr(11, 8)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
