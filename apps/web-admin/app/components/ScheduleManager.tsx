'use client';

import { useState } from 'react';
import { MosqueConfig, AudioSchedule, Playlist } from '@mosque-digital-clock/shared-types';
import { Plus, Trash2, Calendar, Clock, Volume2, ChevronDown, ChevronUp, Check, X, Music, AlertCircle } from 'lucide-react';

interface ScheduleManagerProps {
    config: MosqueConfig;
    setConfig: (config: MosqueConfig) => void;
}

const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'] as const;
const prayerLabel: Record<string, string> = {
    subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar',
    maghrib: 'Maghrib', isya: 'Isya', jumat: "Jum'at"
};

function getSchedulePreview(schedule: AudioSchedule, playlists: Playlist[]): string {
    const pName = playlists.find(p => p.id === schedule.playlistId)?.name || 'Playlist tidak ditemukan';
    if (schedule.type === 'prayer_relative') {
        const prayer = prayerLabel[schedule.prayer || ''] || schedule.prayer?.toUpperCase() || '?';
        const offset = schedule.offsetMinutes || 0;
        const sign = offset < 0 ? `${offset}mnt sebelum` : offset > 0 ? `+${offset}mnt setelah` : 'tepat saat';
        const trigger = schedule.trigger === 'iqamah' ? 'Iqamah' : 'Adzan';
        return `${prayer} — ${sign} ${trigger} → ${pName}`;
    } else {
        const days = schedule.days?.length
            ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', "Jum", 'Sab'].filter((_, i) => schedule.days?.includes(i)).join(', ')
            : 'Setiap hari';
        return `${schedule.time || '--:--'} (${days}) → ${pName}`;
    }
}

export default function ScheduleManager({ config, setConfig }: ScheduleManagerProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const getSchedules = () => config.audio?.schedules || [];
    const getPlaylists = () => config.audio?.playlists || [];

    const updateConfigSchedules = (newSchedules: AudioSchedule[]) => {
        setConfig({ ...config, audio: { ...config.audio, schedules: newSchedules } });
    };

    const handleCreateSchedule = () => {
        const newSchedule: AudioSchedule = {
            id: `sch-${Date.now()}`,
            playlistId: getPlaylists()[0]?.id || '',
            type: 'prayer_relative',
            prayer: 'subuh',
            trigger: 'adzan',
            offsetMinutes: -10,
            playMode: 'before',
            enabled: true
        };
        updateConfigSchedules([...getSchedules(), newSchedule]);
        setExpandedId(newSchedule.id);
    };

    const handleDeleteSchedule = (id: string) => {
        if (confirm('Hapus jadwal ini?')) {
            updateConfigSchedules(getSchedules().filter(s => s.id !== id));
            if (expandedId === id) setExpandedId(null);
        }
    };

    const handleUpdate = (id: string, updates: Partial<AudioSchedule>) => {
        updateConfigSchedules(getSchedules().map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const schedules = getSchedules();
    const playlists = getPlaylists();

    return (
        <div className="space-y-3">
            {/* Empty State */}
            {schedules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                    <Clock size={40} className="mb-3 opacity-40" />
                    <p className="font-semibold text-slate-500 mb-1">Belum ada jadwal putar audio</p>
                    <p className="text-sm text-slate-400">Buat jadwal baru untuk mengatur kapan murottal diputar secara otomatis.</p>
                </div>
            )}

            {/* Schedule List */}
            {schedules.map((schedule) => {
                const isExpanded = expandedId === schedule.id;
                const preview = getSchedulePreview(schedule, playlists);
                const hasNoPlaylist = !schedule.playlistId || !playlists.find(p => p.id === schedule.playlistId);

                return (
                    <div
                        key={schedule.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded
                            ? 'border-emerald-200 shadow-md shadow-emerald-50'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                    >
                        {/* Card Header — always visible */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                            className="w-full flex items-center gap-3 p-4 bg-white text-left"
                        >
                            {/* Enable Toggle */}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleUpdate(schedule.id, { enabled: !schedule.enabled }); }}
                                className={`shrink-0 w-10 h-6 rounded-full relative transition-colors cursor-pointer ${schedule.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                title={schedule.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${schedule.enabled ? 'left-5' : 'left-1'}`} />
                            </div>

                            {/* Preview Text */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${schedule.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                    {preview}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    {schedule.type === 'prayer_relative' ? '📿 Relatif Waktu Sholat' : '⏰ Jam Tertentu'}
                                    {hasNoPlaylist && <span className="ml-2 text-amber-500">⚠ Playlist belum dipilih</span>}
                                </p>
                            </div>

                            {/* Expand Icon */}
                            <div className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={16} />
                            </div>
                        </button>

                        {/* Expanded Editor */}
                        {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">

                                {/* Row 1: Playlist + Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Music size={12} /> Playlist Audio</label>
                                        <select
                                            value={schedule.playlistId}
                                            onChange={(e) => handleUpdate(schedule.id, { playlistId: e.target.value })}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none"
                                        >
                                            <option value="" disabled>— Pilih Playlist —</option>
                                            {playlists.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.tracks.length} track)</option>
                                            ))}
                                        </select>
                                        {playlists.length === 0 && (
                                            <p className="text-[10px] text-amber-600 flex items-center gap-1"><AlertCircle size={10} /> Buat playlist dulu di tab "Playlist Audio".</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Tipe Penjadwalan</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdate(schedule.id, { type: 'prayer_relative' })}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${schedule.type === 'prayer_relative'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                                                }`}
                                            >
                                                <span className="text-base">🕌</span>
                                                Waktu Sholat
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdate(schedule.id, { type: 'manual_time', time: schedule.time || '07:00', durationMinutes: schedule.durationMinutes || 30 })}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${schedule.type === 'manual_time'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                                                }`}
                                            >
                                                <span className="text-base">⏰</span>
                                                Jam Tertentu
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Prayer-relative config */}
                                {schedule.type === 'prayer_relative' && (
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Sholat</label>
                                                <select
                                                    value={schedule.prayer}
                                                    onChange={(e) => handleUpdate(schedule.id, { prayer: e.target.value as any })}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-emerald-500 outline-none"
                                                >
                                                    {prayers.map(p => <option key={p} value={p}>{prayerLabel[p]}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titik Acuan</label>
                                                <select
                                                    value={schedule.trigger}
                                                    onChange={(e) => handleUpdate(schedule.id, { trigger: e.target.value as any })}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-emerald-500 outline-none"
                                                >
                                                    <option value="adzan">Waktu Adzan</option>
                                                    <option value="iqamah">Waktu Iqamah</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                <span>Offset (Menit)</span>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${(schedule.offsetMinutes || 0) < 0 ? 'bg-blue-100 text-blue-700' : (schedule.offsetMinutes || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {(schedule.offsetMinutes || 0) < 0
                                                        ? `${Math.abs(schedule.offsetMinutes || 0)} mnt SEBELUM`
                                                        : (schedule.offsetMinutes || 0) > 0
                                                            ? `${schedule.offsetMinutes} mnt SETELAH`
                                                            : 'Tepat saat Adzan/Iqamah'}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range" min="-60" max="60"
                                                    value={schedule.offsetMinutes || 0}
                                                    onChange={(e) => handleUpdate(schedule.id, { offsetMinutes: parseInt(e.target.value) })}
                                                    className="flex-1 accent-emerald-600"
                                                />
                                                <input
                                                    type="number"
                                                    value={schedule.offsetMinutes || 0}
                                                    onChange={(e) => handleUpdate(schedule.id, { offsetMinutes: parseInt(e.target.value) })}
                                                    className="w-16 p-2 border border-slate-200 rounded-lg text-center font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">
                                                Contoh: <b>-10</b> = audio mulai 10 menit SEBELUM Adzan. <b>+5</b> = mulai 5 menit SETELAH Adzan.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Row 2b: Manual time config */}
                                {schedule.type === 'manual_time' && (
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    value={schedule.time || '07:00'}
                                                    onChange={(e) => handleUpdate(schedule.id, { time: e.target.value })}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durasi (Menit)</label>
                                                <input
                                                    type="number" min="1" max="1440"
                                                    value={schedule.durationMinutes || 30}
                                                    onChange={(e) => handleUpdate(schedule.id, { durationMinutes: parseInt(e.target.value) })}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hari Aktif (Kosongi = setiap hari)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', "Jum", 'Sab'].map((day, idx) => {
                                                    const isSelected = schedule.days?.includes(idx);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = schedule.days || [];
                                                                const next = isSelected ? current.filter(d => d !== idx) : [...current, idx].sort();
                                                                handleUpdate(schedule.id, { days: next });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Row 3: Delete */}
                                <div className="flex justify-end pt-1">
                                    <button
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition border border-transparent hover:border-red-100"
                                    >
                                        <Trash2 size={14} /> Hapus Jadwal Ini
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Create CTA */}
            <button
                onClick={handleCreateSchedule}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-600 font-bold text-sm hover:bg-emerald-50 hover:border-emerald-400 transition-all group"
            >
                <div className="w-7 h-7 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center transition-colors">
                    <Plus size={16} />
                </div>
                Buat Jadwal Baru
            </button>
        </div>
    );
}
