'use client';

import { useState, useEffect } from 'react';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { Clock, MapPin, Loader2, ChevronRight, Calendar } from 'lucide-react';

export function PrayerTimesCard({ config }: { config: MosqueConfig }) {
    const [prayers, setPrayers] = useState<Record<string, string> | null>(null);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string, delta: string } | null>(null);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch('/api/prayer-times-status');
                if (res.ok) {
                    const data = await res.json();
                    setPrayers(data.prayers);
                    setNextPrayer(data.next);
                }
            } catch (e) {
                console.error("Failed to fetch prayer status", e);
            } finally {
                setLoading(false);
            }
        }

        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, [config]);

    if (loading) return <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-100"><Loader2 className="animate-spin text-emerald-500" /></div>;

    if (!prayers || !nextPrayer) return null;

    // Helper to get prayer index for timeline visualization
    const prayerNames = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    const activeIndex = prayerNames.indexOf(nextPrayer.name) === -1 ? 0 : prayerNames.indexOf(nextPrayer.name);

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 relative overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Server Status
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold text-lg">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span className="truncate max-w-[200px]">{config.mosqueInfo.name}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                </div>
            </div>

            {/* Main Featured Prayer */}
            <div className="mb-8 relative z-10">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-60"></div>

                <div className="flex items-baseline gap-1 text-slate-500 text-sm mb-1">
                    <span>Menuju</span>
                    <span className="font-bold text-emerald-600">{nextPrayer.name}</span>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-5xl font-black text-slate-800 tracking-tight">
                            {nextPrayer.delta}
                        </div>
                        <div className="text-sm font-medium text-slate-400 mt-1">
                            Pukul {nextPrayer.time} WIB
                        </div>
                    </div>
                    <div className="bg-emerald-100/50 p-3 rounded-2xl">
                        <Clock className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Timeline / List */}
            <div className="space-y-3 mt-auto">
                {Object.entries(prayers).map(([name, time], index) => {
                    const isNext = name === nextPrayer.name;
                    // Simple check if passed (logic wise this is rough without real time comparison, but visually okay for now based on 'next')
                    const isPassed = !isNext && prayerNames.indexOf(name) < activeIndex && prayerNames.includes(name);

                    return (
                        <div key={name} className={`group flex justify-between items-center p-3 rounded-xl transition-all duration-300 ${isNext ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${isNext ? 'bg-white' : isPassed ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                                <span className={`text-sm font-semibold capitalize ${isNext ? 'text-white' : isPassed ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {name}
                                </span>
                            </div>
                            <span className={`text-sm font-mono font-bold ${isNext ? 'text-emerald-50' : isPassed ? 'text-slate-300' : 'text-slate-700'}`}>
                                {time}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
