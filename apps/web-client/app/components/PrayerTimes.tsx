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

    const prayers = [
        { name: 'Imsak', time: formatTime(times.imsak) },
        { name: 'Subuh', time: formatTime(times.subuh) },
        { name: 'Syuruq', time: formatTime(times.syuruq) },
        { name: 'Dzuhur', time: formatTime(times.dzuhur) },
        { name: 'Ashar', time: formatTime(times.ashar) },
        { name: 'Maghrib', time: formatTime(times.maghrib) },
        { name: 'Isya', time: formatTime(times.isya) },
    ];

    // Determine active prayer based on next event or current time
    // For simplicity, we'll basic highlighting here. The parent component usually handles "next event".
    // But to match the mockup, let's highlight "Dzuhur" as an example or pass a prop.
    // Ideally, we should pass `nextPrayer` prop to this component. 
    return (
        <div className="flex flex-row w-full h-full">
            {prayers.map((prayer, index) => {
                const isActive = nextPrayer?.toLowerCase() === prayer.name.toLowerCase();
                return (
                    <div
                        key={prayer.name}
                        className={`
                            relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300
                            ${!isActive && index < prayers.length - 1 ? 'border-r-2 border-amber-400/30' : ''}
                            ${isActive
                                ? 'bg-orange-500 text-white shadow-lg transform scale-y-110 origin-bottom rounded-t-lg z-10 -mt-1'
                                : 'bg-transparent text-slate-800 hover:bg-slate-50'}
                        `}
                    >
                        {/* Ornamental top line for non-active items */}
                        {!isActive && <div className="absolute top-3 w-1 h-4 bg-amber-400/20 rounded-full mb-1"></div>}

                        <span className={`text-sm uppercase tracking-widest font-bold mb-0 z-10 ${isActive ? 'text-orange-100' : 'text-slate-500'}`}>
                            {prayer.name}
                        </span>
                        <span className={`text-4xl font-bold font-mono tracking-tighter tabular-nums z-10 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {prayer.time}
                        </span>

                        {isActive && secondsRemaining !== undefined && secondsRemaining > 0 && (
                            <div className="absolute bottom-1 bg-black/20 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-widest text-white backdrop-blur-sm">
                                -{new Date(secondsRemaining * 1000).toISOString().substr(11, 8)}
                            </div>
                        )}

                        {/* Decorative bottom accent for active */}
                        {isActive && <div className="absolute bottom-0 w-full h-1 bg-orange-700/30"></div>}
                    </div>
                );
            })}
        </div>
    );
};
