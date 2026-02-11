'use client';

import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { Palette, Eye, Type, Layers, Codepen, Sliders } from 'lucide-react';

interface AdvancedConfigSectionProps {
    config: MosqueConfig | null;
    setConfig: (config: MosqueConfig) => void;
}

export default function AdvancedConfigSection({ config, setConfig }: AdvancedConfigSectionProps) {
    if (!config) return null;

    const adv = config.advancedDisplay || {
        showLogo: true,
        showDate: true,
        showClock: true,
        showRunningText: true,
        showPrayerTimes: true,
        theme: 'light',
        fontScale: 'normal',
        headerOpacity: 1.0,
        prayerTimesOpacity: 1.0
    };

    const updateAdv = (key: string, value: any) => {
        setConfig({
            ...config,
            advancedDisplay: {
                ...adv,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-6">

            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                        <Sliders size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Advanced Configuration</h2>
                        <p className="text-indigo-100">Atur tampilan detail, warna, dan transparansi layout client.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Visibility Toggles */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Eye size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Elemen Tampilan</h3>
                    </div>

                    <div className="space-y-4">
                        <Toggle label="Tampilkan Logo" checked={adv.showLogo ?? true} onChange={(v) => updateAdv('showLogo', v)} />
                        <Toggle label="Tampilkan Jam Besar" checked={adv.showClock ?? true} onChange={(v) => updateAdv('showClock', v)} />
                        <Toggle label="Tampilkan Tanggal" checked={adv.showDate ?? true} onChange={(v) => updateAdv('showDate', v)} />
                        <Toggle label="Tampilkan Running Text" checked={adv.showRunningText ?? true} onChange={(v) => updateAdv('showRunningText', v)} />
                        <Toggle label="Tampilkan Jadwal Sholat" checked={adv.showPrayerTimes ?? true} onChange={(v) => updateAdv('showPrayerTimes', v)} />
                    </div>
                </div>

                {/* 2. Theme & Layout */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Layers size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tema & Layout</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Base Theme</label>
                            <select
                                value={adv.theme || 'light'}
                                onChange={(e) => updateAdv('theme', e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                            >
                                <option value="light">Light (Terang)</option>
                                <option value="dark">Dark (Gelap)</option>
                                <option value="glass">Glassmorphism (Transparan)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Ukuran Font</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['small', 'normal', 'large'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateAdv('fontScale', s)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border ${adv.fontScale === s ? 'bg-violet-50 border-violet-500 text-violet-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Opacity Sliders */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <RangeSlider
                                label="Header Opacity"
                                value={adv.headerOpacity ?? 1}
                                onChange={(v) => updateAdv('headerOpacity', parseFloat(v))}
                                min="0" max="1" step="0.1"
                            />
                            <RangeSlider
                                label="Prayer Times Opacity"
                                value={adv.prayerTimesOpacity ?? 1}
                                onChange={(v) => updateAdv('prayerTimesOpacity', parseFloat(v))}
                                min="0" max="1" step="0.1"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Custom Colors */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                            <Palette size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Kustomisasi Warna</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ColorInput label="Header Text Color" value={adv.headerTextColor} onChange={(v) => updateAdv('headerTextColor', v)} placeholder="#1e293b" />
                        <ColorInput label="Clock Text Color" value={adv.clockTextColor} onChange={(v) => updateAdv('clockTextColor', v)} placeholder="#0f172a" />
                        <ColorInput label="Date Text Color" value={adv.dateTextColor} onChange={(v) => updateAdv('dateTextColor', v)} placeholder="#64748b" />

                        <ColorInput label="Running Text Color" value={adv.runningTextColor} onChange={(v) => updateAdv('runningTextColor', v)} placeholder="#ffffff" />
                        <ColorInput label="Running Text Bg" value={adv.runningTextBgColor} onChange={(v) => updateAdv('runningTextBgColor', v)} placeholder="#0f172a" />

                        <ColorInput label="Prayer Times Text" value={adv.prayerTimesTextColor} onChange={(v) => updateAdv('prayerTimesTextColor', v)} placeholder="#1e293b" />
                        <ColorInput label="Prayer Times Bg" value={adv.prayerTimesBgColor} onChange={(v) => updateAdv('prayerTimesBgColor', v)} placeholder="#ffffff" />
                        <ColorInput label="Active Prayer Color" value={adv.prayerTimesActiveColor} onChange={(v) => updateAdv('prayerTimesActiveColor', v)} placeholder="#f97316" />
                    </div>
                </div>

                {/* 4. Custom CSS */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Codepen size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Custom CSS (Expert Mode)</h3>
                    </div>
                    <textarea
                        value={adv.customCss || ''}
                        onChange={(e) => updateAdv('customCss', e.target.value)}
                        placeholder=".header { background: red; }"
                        className="w-full h-32 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
}

// --- Helpers ---

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function RangeSlider({ label, value, onChange, min, max, step }: { label: string, value: number, onChange: (v: string) => void, min: string, max: string, step: string }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-slate-600">{label}</label>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{value}</span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
        </div>
    );
}

function ColorInput({ label, value, onChange, placeholder }: { label: string, value?: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 relative">
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                    />
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none font-mono uppercase"
                />
            </div>
        </div>
    );
}
