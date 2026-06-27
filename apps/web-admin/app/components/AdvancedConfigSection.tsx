'use client';

import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { Palette, Eye, Type, Layers, Codepen, Sliders, Video, Activity, Zap } from 'lucide-react';

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
        prayerTimesOpacity: 1.0,
        headerBlur: 0,
        prayerTimesBlur: 0,
        runningTextSpeed: 10,
        clockWeight: 'bold',
        showNextPrayerCountdown: true
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
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                        <Sliders size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Advanced Configuration</h2>
                        <p className="text-emerald-100 font-medium">Kustomisasi mendalam untuk tampilan yang lebih profesional dan premium.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Visibility Toggles */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                            <Eye size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Elemen Tampilan</h3>
                    </div>

                    <div className="space-y-5">
                        <Toggle label="Tampilkan Logo" checked={adv.showLogo ?? true} onChange={(v) => updateAdv('showLogo', v)} />
                        <Toggle label="Tampilkan Jam Besar" checked={adv.showClock ?? true} onChange={(v) => updateAdv('showClock', v)} />
                        <Toggle label="Tampilkan Tanggal" checked={adv.showDate ?? true} onChange={(v) => updateAdv('showDate', v)} />
                        <Toggle label="Tampilkan Running Text" checked={adv.showRunningText ?? true} onChange={(v) => updateAdv('showRunningText', v)} />
                        <Toggle label="Tampilkan Jadwal Sholat" checked={adv.showPrayerTimes ?? true} onChange={(v) => updateAdv('showPrayerTimes', v)} />
                        <div className="pt-2 border-t border-slate-50">
                            <Toggle label="Hitung Mundur Sholat" checked={adv.showNextPrayerCountdown ?? true} onChange={(v) => updateAdv('showNextPrayerCountdown', v)} />
                        </div>
                        <div className="pt-3 mt-1 border-t border-slate-100">
                            <Toggle label="⚡ Mode Hemat (Perangkat Spesifikasi Rendah)" checked={adv.lowEndMode ?? false} onChange={(v) => updateAdv('lowEndMode', v)} />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Matikan efek blur & animasi berat agar tampilan tetap lancar di PC lawas / mini PC (mis. AMD E2, Intel Atom). Running text & jadwal sholat tetap berjalan normal.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Theme & Typography */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                            <Type size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Tipografi & Tema</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Base Theme</label>
                            <select
                                value={adv.theme || 'light'}
                                onChange={(e) => updateAdv('theme', e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                            >
                                <option value="light">☀️ Light (Terang Modern)</option>
                                <option value="dark">🌙 Dark (Gelap Premium)</option>
                                <option value="glass">💎 Glassmorphism (Kaca Transparan)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Ketebalan Jam (Clock Weight)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'light', label: 'Light', weight: 'font-light' },
                                    { id: 'normal', label: 'Normal', weight: 'font-medium' },
                                    { id: 'bold', label: 'Bold', weight: 'font-black' }
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => updateAdv('clockWeight', s.id)}
                                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${adv.clockWeight === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                                    >
                                        <span className={s.weight}>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Ukuran Konten</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['small', 'normal', 'large'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateAdv('fontScale', s)}
                                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${adv.fontScale === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                                    >
                                        {s.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Transparansi & Efek Visual */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Transparansi & Efek</h3>
                    </div>

                    <div className="space-y-6">
                        <RangeSlider
                            label="Header Opacity"
                            value={adv.headerOpacity ?? 1}
                            onChange={(v) => updateAdv('headerOpacity', parseFloat(v))}
                            min="0" max="1" step="0.05"
                        />
                        <RangeSlider
                            label="Header Blur"
                            value={adv.headerBlur ?? 10}
                            onChange={(v) => updateAdv('headerBlur', parseInt(v))}
                            min="0" max="30" step="1"
                            suffix="px"
                        />
                        <div className="pt-4 border-t border-slate-50 space-y-6">
                            <RangeSlider
                                label="Jadwal Sholat Opacity"
                                value={adv.prayerTimesOpacity ?? 1}
                                onChange={(v) => updateAdv('prayerTimesOpacity', parseFloat(v))}
                                min="0" max="1" step="0.05"
                            />
                            <RangeSlider
                                label="Jadwal Sholat Blur"
                                value={adv.prayerTimesBlur ?? 0}
                                onChange={(v) => updateAdv('prayerTimesBlur', parseInt(v))}
                                min="0" max="30" step="1"
                                suffix="px"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Kecepatan Gerak */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                            <Activity size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Kecepatan Gerak</h3>
                    </div>

                    <div className="space-y-8">
                        <RangeSlider
                            label="Kecepatan Running Text"
                            value={adv.runningTextSpeed ?? 10}
                            onChange={(v) => updateAdv('runningTextSpeed', parseInt(v))}
                            min="1" max="25" step="1"
                            help="Makin tinggi makin cepat."
                        />
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-xs text-orange-700 leading-relaxed">
                                <b>Tips:</b> Gunakan kecepatan sedang (10-12) agar teks tetap nyaman dibaca oleh jamaah dari kejauhan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. Custom Colors (Premium) */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Professional Color Customization</h3>
                                <p className="text-slate-400 text-sm">Sesuaikan palet warna untuk mencapai nuansa premium.</p>
                            </div>
                        </div>
                        <div className="hidden sm:block px-4 py-1.5 bg-pink-500/20 text-pink-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-500/30">
                            Premium Editor
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                        <div className="space-y-8">
                            <ColorInput label="Header Text" value={adv.headerTextColor} onChange={(v) => updateAdv('headerTextColor', v)} placeholder="#1e293b" isDark />
                            <ColorInput label="Clock Text" value={adv.clockTextColor} onChange={(v) => updateAdv('clockTextColor', v)} placeholder="#0f172a" isDark />
                            <ColorInput label="Date & Hijri" value={adv.dateTextColor} onChange={(v) => updateAdv('dateTextColor', v)} placeholder="#64748b" isDark />
                        </div>
                        
                        <div className="space-y-8">
                            <ColorInput label="Clock Glow Effect" value={adv.glowColor} onChange={(v) => updateAdv('glowColor', v)} placeholder="#10b981" isDark />
                            <ColorInput label="Running Text Text" value={adv.runningTextColor} onChange={(v) => updateAdv('runningTextColor', v)} placeholder="#ffffff" isDark />
                            <ColorInput label="Running Text BG" value={adv.runningTextBgColor} onChange={(v) => updateAdv('runningTextBgColor', v)} placeholder="#000000" isDark />
                        </div>

                        <div className="space-y-8">
                            <ColorInput label="Prayer Row BG" value={adv.prayerTimesBgColor} onChange={(v) => updateAdv('prayerTimesBgColor', v)} placeholder="#ffffff" isDark />
                            <ColorInput label="Prayer Row Text" value={adv.prayerTimesTextColor} onChange={(v) => updateAdv('prayerTimesTextColor', v)} placeholder="#000000" isDark />
                            <ColorInput label="Slideshow Overlay" value={adv.slideshowOverlayColor} onChange={(v) => updateAdv('slideshowOverlayColor', v)} placeholder="rgba(0,0,0,0.8)" isDark />
                        </div>

                        <div className="space-y-8 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={10} /> Active State
                            </h4>
                            <ColorInput label="Active Row BG" value={adv.prayerTimesActiveBgColor} onChange={(v) => updateAdv('prayerTimesActiveBgColor', v)} placeholder="#10b981" isDark />
                            <ColorInput label="Active Row Text" value={adv.prayerTimesActiveTextColor} onChange={(v) => updateAdv('prayerTimesActiveTextColor', v)} placeholder="#ffffff" isDark />
                            <ColorInput label="Active Accent" value={adv.prayerTimesActiveColor} onChange={(v) => updateAdv('prayerTimesActiveColor', v)} placeholder="#f97316" isDark />
                        </div>
                    </div>
                </div>

                {/* 6. Custom CSS */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                            <Codepen size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Custom CSS (Expert Mode)</h3>
                            <p className="text-slate-400 text-xs font-medium">Timpa gaya default dengan CSS kustom Anda sendiri.</p>
                        </div>
                    </div>
                    <textarea
                        value={adv.customCss || ''}
                        onChange={(e) => updateAdv('customCss', e.target.value)}
                        placeholder=".header { transform: skewX(-5deg); }"
                        className="w-full h-40 p-6 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none border border-slate-800 shadow-inner"
                    />
                </div>


            </div>
        </div>
    );
}

// --- Helpers ---

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between group">
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wider">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function RangeSlider({ label, value, onChange, min, max, step, suffix = "", help = "" }: { label: string, value: number, onChange: (v: string) => void, min: string, max: string, step: string, suffix?: string, help?: string }) {
    return (
        <div className="group">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                    {help && <p className="text-[10px] text-slate-400 font-medium">{help}</p>}
                </div>
                <span className="text-sm font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-700 min-w-12 text-center border border-slate-200">
                    {value}{suffix}
                </span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all border border-slate-200"
            />
        </div>
    );
}

function ColorInput({ label, value, onChange, placeholder, isDark = false }: { label: string, value?: string, onChange: (v: string) => void, placeholder: string, isDark?: boolean }) {
    return (
        <div className="group/color">
            <label className={`block text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-[0.2em] mb-2.5 group-hover/color:text-emerald-400 transition-colors`}>{label}</label>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0 relative shadow-lg group-hover/color:scale-110 transition-transform cursor-pointer">
                    <input
                        type="color"
                        value={value?.startsWith('#') ? value : '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
                    />
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`w-full p-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase transition-all
                            ${isDark ? 'bg-white/5 border-white/10 text-emerald-400 placeholder:text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-800'}
                        `}
                    />
                </div>
            </div>
        </div>
    );
}
