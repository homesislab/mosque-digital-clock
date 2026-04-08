'use client';

import { useState, useEffect } from 'react';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { Clock, MapPin, Loader2, ChevronRight, Calendar } from 'lucide-react';

import { getPrayerTimes, getNextPrayer, formatTime } from '@/lib/prayer-times';

export function PrayerTimesCard({ config, mosqueKey }: { config: MosqueConfig, mosqueKey: string }) {
    // We still keep local state for "Next Prayer" countdown timer
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!config) return null;

    // Apply server time offset
    const correctedNow = config.display?.timeOffset
        ? new Date(currentTime.getTime() + config.display.timeOffset * 1000)
        : currentTime;

    const calculations = getPrayerTimes(config, correctedNow);
    if (!calculations) return null;

    const next = getNextPrayer(calculations, correctedNow);
    const isFriday = correctedNow.getDay() === 5;

    const prayers = {
        Imsak: formatTime(calculations.imsak),
        Subuh: formatTime(calculations.subuh),
        Syuruq: formatTime(calculations.syuruq),
        [isFriday ? 'Jumat' : 'Dzuhur']: formatTime(calculations[isFriday ? 'jumat' : 'dzuhur']),
        Ashar: formatTime(calculations.ashar),
        Maghrib: formatTime(calculations.maghrib),
        Isya: formatTime(calculations.isya),
    };

    const nextPrayer = next;


    // Helper to get prayer index for timeline visualization
    const prayerNames = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    const activeIndex = prayerNames.indexOf(nextPrayer.name) === -1 ? 0 : prayerNames.indexOf(nextPrayer.name);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Live Server Status
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold text-base">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="truncate max-w-[200px]">{config.mosqueInfo.name}</span>
                    </div>
                </div>
                <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
            </div>

            {/* Main Featured Prayer */}
            <div className="mb-5 bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-baseline gap-1 text-slate-500 text-xs mb-1">
                    <span>Menuju</span>
                    <span className="font-bold text-emerald-600">{nextPrayer.name}</span>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-4xl font-black text-slate-800 tracking-tight">
                            {nextPrayer.delta}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5">
                            Pukul {nextPrayer.time} WIB
                        </div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Prayer List */}
            <div className="space-y-1 mt-auto">
                {Object.entries(prayers).map(([name, time]) => {
                    const isNext = name === nextPrayer.name;
                    const isPassed = !isNext && prayerNames.indexOf(name) < activeIndex && prayerNames.includes(name);

                    return (
                        <div key={name} className={`flex justify-between items-center px-3 py-2.5 rounded-lg transition-colors ${
                            isNext
                                ? 'bg-amber-500 text-white'
                                : 'hover:bg-slate-50'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    isNext ? 'bg-white' : isPassed ? 'bg-slate-200' : 'bg-emerald-500'
                                }`}></div>
                                <span className={`text-sm font-semibold ${
                                    isNext ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-600'
                                }`}>
                                    {name}
                                </span>
                            </div>
                            <span className={`text-sm font-mono font-bold ${
                                isNext ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                                {time}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
