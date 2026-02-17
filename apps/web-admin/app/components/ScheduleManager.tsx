'use client';

import { useState } from 'react';
import { MosqueConfig, AudioSchedule, Playlist } from '@mosque-digital-clock/shared-types';
import { Plus, Trash2, Calendar, Clock, Volume2, ChevronRight, Check, X } from 'lucide-react';

interface ScheduleManagerProps {
    config: MosqueConfig;
    setConfig: (config: MosqueConfig) => void;
}

const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'] as const;

export default function ScheduleManager({ config, setConfig }: ScheduleManagerProps) {
    const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

    const getSchedules = () => config.audio?.schedules || [];
    const getPlaylists = () => config.audio?.playlists || [];

    const activeSchedule = getSchedules().find(s => s.id === activeScheduleId);

    const updateConfigSchedules = (newSchedules: AudioSchedule[]) => {
        setConfig({
            ...config,
            audio: {
                ...config.audio,
                schedules: newSchedules
            }
        });
    };

    const handleCreateSchedule = () => {
        const newSchedule: AudioSchedule = {
            id: `sch-${Date.now()}`,
            playlistId: getPlaylists()[0]?.id || '',
            type: 'prayer_relative',
            prayer: 'subuh',
            trigger: 'adzan',
            offsetMinutes: -10, // Default 10 mins before
            playMode: 'before',
            enabled: true
        };
        updateConfigSchedules([...getSchedules(), newSchedule]);
        setActiveScheduleId(newSchedule.id);
    };

    const handleDeleteSchedule = (id: string) => {
        if (confirm('Hapus jadwal ini?')) {
            const newSchedules = getSchedules().filter(s => s.id !== id);
            updateConfigSchedules(newSchedules);
            if (activeScheduleId === id) setActiveScheduleId(null);
        }
    };

    const handleUpdateSchedule = (id: string, updates: Partial<AudioSchedule>) => {
        const newSchedules = getSchedules().map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        updateConfigSchedules(newSchedules);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* List Sidebar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700">Daftar Jadwal</h3>
                    <button
                        onClick={handleCreateSchedule}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        title="Buat Jadwal Baru"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {getSchedules().length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                            Belum ada jadwal.
                        </div>
                    )}
                    {getSchedules().map(schedule => {
                        const playlistName = getPlaylists().find(p => p.id === schedule.playlistId)?.name || 'Unknown Playlist';
                        return (
                            <button
                                key={schedule.id}
                                onClick={() => setActiveScheduleId(schedule.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${activeScheduleId === schedule.id
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                                        : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                    }`}
                            >
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${schedule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                        {schedule.type === 'prayer_relative'
                                            ? `${schedule.prayer?.toUpperCase()} (${schedule.offsetMinutes}m)`
                                            : `MANUAL ${schedule.time}`
                                        }
                                    </div>
                                    <div className="text-xs opacity-70 truncate">{playlistName}</div>
                                </div>
                                <ChevronRight size={16} className={`transition-transform ${activeScheduleId === schedule.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100'}`} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Edit Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {activeSchedule ? (
                    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Edit Jadwal</h3>
                                    <p className="text-xs text-slate-400 font-mono">{activeSchedule.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateSchedule(activeSchedule.id, { enabled: !activeSchedule.enabled })}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeSchedule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {activeSchedule.enabled ? <Check size={16} /> : <X size={16} />}
                                    {activeSchedule.enabled ? 'AKTIF' : 'NON-AKTIF'}
                                </button>
                                <button
                                    onClick={() => handleDeleteSchedule(activeSchedule.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Playlist Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Playlist</label>
                            <select
                                value={activeSchedule.playlistId}
                                onChange={(e) => handleUpdateSchedule(activeSchedule.id, { playlistId: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="" disabled>Pilih Playlist</option>
                                {getPlaylists().map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.tracks.length} tracks)</option>
                                ))}
                            </select>
                        </div>

                        {/* Schedule Type */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipe Jadwal</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleUpdateSchedule(activeSchedule.id, { type: 'prayer_relative' })}
                                    className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${activeSchedule.type === 'prayer_relative'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Clock size={18} /> Mengikuti Waktu Sholat
                                </button>
                                <button
                                    onClick={() => handleUpdateSchedule(activeSchedule.id, { type: 'manual_time' })}
                                    className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition opacity-50 cursor-not-allowed ${activeSchedule.type === 'manual_time'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    disabled title="Coming Soon"
                                >
                                    <Clock size={18} /> Waktu Manual (Jam:Menit)
                                </button>
                            </div>
                        </div>

                        {activeSchedule.type === 'prayer_relative' && (
                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu Sholat</label>
                                        <select
                                            value={activeSchedule.prayer}
                                            onChange={(e) => handleUpdateSchedule(activeSchedule.id, { prayer: e.target.value as any })}
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold uppercase"
                                        >
                                            {prayers.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Titik Acuan (Trigger)</label>
                                        <select
                                            value={activeSchedule.trigger}
                                            onChange={(e) => handleUpdateSchedule(activeSchedule.id, { trigger: e.target.value as any })}
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold uppercase"
                                        >
                                            <option value="adzan">Waktu Adzan</option>
                                            <option value="iqamah">Waktu Iqamah</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Offset Waktu (Menit)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="-60"
                                            max="60"
                                            value={activeSchedule.offsetMinutes || 0}
                                            onChange={(e) => handleUpdateSchedule(activeSchedule.id, { offsetMinutes: parseInt(e.target.value) })}
                                            className="flex-1 accent-emerald-600"
                                        />
                                        <input
                                            type="number"
                                            value={activeSchedule.offsetMinutes || 0}
                                            onChange={(e) => handleUpdateSchedule(activeSchedule.id, { offsetMinutes: parseInt(e.target.value) })}
                                            className="w-20 p-2 border border-slate-200 rounded-lg text-center font-bold"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 italic">
                                        Negatif (-) berarti MENDAHULUI Trigger. Positif (+) berarti SETELAH Trigger.
                                        <br />
                                        Contoh: -10 menit dari Adzan = Mulai play 10 menit SEBELUM Adzan.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-orange-50 text-orange-800 text-xs rounded-lg border border-orange-100 flex items-start gap-2">
                            <Volume2 size={16} className="mt-0.5 shrink-0" />
                            <p>
                                <strong>Logika Playback:</strong> Jika offset (-), audio akan diputar DURANTE (selama) waktu offset tersebut hingga mencapai waktu Trigger.
                                <br />Jika offset (+), audio akan diputar mulai dari (Trigger + Offset) selama durasi tertentu (Default 15 menit).
                            </p>
                        </div>

                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                        <Clock size={64} className="mb-4 opacity-50" />
                        <p className="font-medium">Pilih jadwal untuk mengedit</p>
                    </div>
                )}
            </div>
        </div>
    );
}
