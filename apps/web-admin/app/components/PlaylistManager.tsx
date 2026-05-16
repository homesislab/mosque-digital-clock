'use client';

import { useState, useEffect } from 'react';
import { MosqueConfig, Playlist, AudioTrack } from '@mosque-digital-clock/shared-types';
import { Plus, Trash2, Music, Disc, ChevronRight, UploadCloud, Library, X, Shuffle, Calendar, Monitor, Tv, Play, Pause, Download, Globe } from 'lucide-react';
import { useRef } from 'react';
import ScheduleManager from './ScheduleManager';
import { QuranBrowser } from '@/components/QuranBrowser';

interface PlaylistManagerProps {
    config: MosqueConfig;
    setConfig: (config: MosqueConfig) => void;
    mosqueKey: string;
    onPickTrack: (playlistId: string) => void;
}

export default function PlaylistManager({ config, setConfig, mosqueKey, onPickTrack }: PlaylistManagerProps) {
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [processingDurations, setProcessingDurations] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isCdnModalOpen, setIsCdnModalOpen] = useState(false);
    const [devices, setDevices] = useState<{ device_id: string; device_name: string }[]>([]);
    
    // Audio Preview State
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleTogglePreview = (trackId: string, url: string) => {
        if (playingTrackId === trackId) {
            audioRef.current?.pause();
            setPlayingTrackId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(url);
            audio.onended = () => setPlayingTrackId(null);
            audio.play();
            audioRef.current = audio;
            setPlayingTrackId(trackId);
        }
    };

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await fetch(`/api/devices?key=${mosqueKey}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDevices(data);
                }
            } catch (err) {
                console.error('Failed to fetch devices:', err);
            }
        };
        fetchDevices();
    }, [mosqueKey]);

    const getPlaylists = () => config.audio?.playlists || [];
    const activePlaylist = getPlaylists().find(p => p.id === activePlaylistId);

    const updateConfigPlaylists = (newPlaylists: Playlist[]) => {
        setConfig({ ...config, audio: { ...config.audio, playlists: newPlaylists } });
    };

    const handleCreatePlaylist = () => {
        const newPlaylist: Playlist = {
            id: `pl-${Date.now()}`,
            name: `Playlist Baru ${getPlaylists().length + 1}`,
            tracks: [],
            shuffle: false
        };
        updateConfigPlaylists([...getPlaylists(), newPlaylist]);
        setActivePlaylistId(newPlaylist.id);
    };

    const handleDeletePlaylist = (id: string) => {
        if (confirm('Hapus playlist ini beserta semua jadwal terkait?')) {
            const newPlaylists = getPlaylists().filter(p => p.id !== id);
            const newSchedules = (config.audio?.schedules || []).filter(s => s.playlistId !== id);
            setConfig({ ...config, audio: { ...config.audio, playlists: newPlaylists, schedules: newSchedules } });
            if (activePlaylistId === id) setActivePlaylistId(null);
        }
    };

    const handleUpdatePlaylist = (id: string, updates: Partial<Playlist>) => {
        updateConfigPlaylists(getPlaylists().map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                resolve(audio.duration === Infinity || isNaN(audio.duration) ? 0 : audio.duration);
            };
            audio.onerror = () => resolve(0);
            audio.load();
        });
    };

    useEffect(() => {
        if (!activePlaylistId || processingDurations) return;
        const playlist = getPlaylists().find(p => p.id === activePlaylistId);
        if (!playlist) return;
        const hasMissingDuration = playlist.tracks.some(t => t.duration === undefined);
        if (hasMissingDuration) {
            const process = async () => {
                setProcessingDurations(true);
                const updatedTracks = [...playlist.tracks];
                let changed = false;
                for (let i = 0; i < updatedTracks.length; i++) {
                    if (updatedTracks[i].duration === undefined) {
                        const duration = await getAudioDuration(updatedTracks[i].url).catch(() => 0);
                        updatedTracks[i] = { ...updatedTracks[i], duration };
                        changed = true;
                    }
                }
                if (changed) handleUpdatePlaylist(activePlaylistId, { tracks: updatedTracks });
                setProcessingDurations(false);
            };
            process();
        }
    }, [activePlaylistId, config.audio?.playlists]);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPlaylistDuration = (playlist: Playlist) => {
        const total = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
        return formatDuration(total);
    };

    const handleAddTrack = async (playlistId: string, url: string, fileName: string) => {
        const playlist = getPlaylists().find(p => p.id === playlistId);
        if (!playlist) return;
        const duration = await getAudioDuration(url);
        const newTrack: AudioTrack = {
            id: `track-${Date.now()}`,
            title: fileName || 'Unknown Track',
            url,
            fileName,
            duration
        };
        handleUpdatePlaylist(playlistId, { tracks: [...playlist.tracks, newTrack] });
    };

    const handleDeleteTrack = (playlistId: string, trackId: string) => {
        const playlist = getPlaylists().find(p => p.id === playlistId);
        if (!playlist) return;
        handleUpdatePlaylist(playlistId, { tracks: playlist.tracks.filter(t => t.id !== trackId) });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, playlistId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!mosqueKey) {
            alert('Error: mosqueKey kosong! Coba refresh halaman.');
            return;
        }

        setUploading(true);
        try {
            const { uploadFileChunked } = await import('../lib/upload-utils');
            const url = await uploadFileChunked(file, mosqueKey, (progress) => {
                console.log(`[Upload] ${file.name}: ${progress}%`);
            });
            if (url) {
                await handleAddTrack(playlistId, url, file.name.replace(/\.[^/.]+$/, ''));
                if (!config.gallery?.includes(url)) {
                    setConfig({ ...config, gallery: [...(config.gallery || []), url] });
                }
            }
        } catch (err: any) {
            console.error('[PlaylistManager Upload Error]', err);
            alert(`Upload gagal:\n${err.message}\n\nFile: ${file.name}\nSize: ${(file.size/1024/1024).toFixed(2)} MB\nKey: ${mosqueKey}`);
        } finally {
            setUploading(false);
            // Reset file input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const playlists = getPlaylists();

    return (
        <div className="flex flex-col lg:flex-row gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '520px' }}>

            {/* ─── Left Sidebar: Playlist List ─────────────────────────────── */}
            <div className="lg:w-64 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50">
                {/* Sidebar Header */}
                <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-sm font-bold text-slate-700">{playlists.length} Playlist</p>
                    </div>
                    <button
                        onClick={handleCreatePlaylist}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                        title="Buat Playlist Baru"
                    >
                        <Plus size={14} />
                        Baru
                    </button>
                </div>

                {/* Playlist Items */}
                <div className="flex-1 overflow-y-auto p-2">
                    {playlists.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center px-4">
                            <Music size={28} className="mb-2 opacity-40" />
                            <p className="text-xs font-medium">Belum ada playlist</p>
                            <p className="text-[10px] mt-0.5">Klik "Baru" untuk membuat</p>
                        </div>
                    )}
                    {playlists.map(playlist => {
                        const isActive = activePlaylistId === playlist.id;
                        return (
                            <button
                                key={playlist.id}
                                onClick={() => setActivePlaylistId(playlist.id)}
                                className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 mb-1 transition-colors group ${
                                    isActive
                                        ? 'bg-emerald-500 text-white'
                                        : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isActive ? 'bg-white/20' : 'bg-slate-200 group-hover:bg-emerald-50'
                                }`}>
                                    <Music size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className={`font-semibold text-sm truncate ${isActive ? 'text-white' : ''}`}>{playlist.name}</div>
                                    <div className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                                        {playlist.tracks.length} track • {getPlaylistDuration(playlist)}
                                    </div>
                                </div>
                                {isActive && <ChevronRight size={14} className="text-white/60 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Right: Detail / Editor ───────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {activePlaylist ? (
                    <>
                        {/* Detail Header */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={activePlaylist.name}
                                        onChange={(e) => handleUpdatePlaylist(activePlaylist.id, { name: e.target.value })}
                                        className="w-full text-lg font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-slate-300"
                                        placeholder="Nama Playlist..."
                                    />
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-slate-400 font-mono">
                                            {activePlaylist.tracks.length} track • Total: {getPlaylistDuration(activePlaylist)}
                                        </span>
                                        {processingDurations && (
                                            <span className="text-[10px] text-emerald-500 font-semibold animate-pulse">Menghitung durasi...</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Action Toolbar ── */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-4">
                                {/* Upload */}
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        uploading
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                >
                                    <UploadCloud size={13} />
                                    <span>{uploading ? 'Upload...' : 'Upload'}</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus,.wma"
                                    onChange={(e) => handleUpload(e, activePlaylist.id)}
                                    disabled={uploading}
                                />

                                {/* Dari Galeri */}
                                <button
                                    onClick={() => onPickTrack(activePlaylist.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all"
                                >
                                    <Library size={13} />
                                    <span>Galeri</span>
                                </button>

                                {/* Download CDN */}
                                <button
                                    onClick={() => setIsCdnModalOpen(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all"
                                >
                                    <Globe size={13} />
                                    <span>CDN</span>
                                </button>

                                {/* Jadwal */}
                                <button
                                    onClick={() => setIsScheduleModalOpen(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
                                >
                                    <Calendar size={13} />
                                    <span>Jadwal</span>
                                </button>

                                {/* Acak / Urut */}
                                <button
                                    onClick={() => handleUpdatePlaylist(activePlaylist.id, { shuffle: !activePlaylist.shuffle })}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                        activePlaylist.shuffle
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                                    }`}
                                >
                                    <Shuffle size={13} />
                                    <span>{activePlaylist.shuffle ? 'Acak' : 'Urut'}</span>
                                </button>

                                {/* Hapus — pushed to right */}
                                <button
                                    onClick={() => handleDeletePlaylist(activePlaylist.id)}
                                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-all"
                                    title="Hapus Playlist"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {/* Target Devices Selection */}
                            <div className="mt-5 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                                        <Monitor size={14} className="text-slate-400" />
                                        Target Client TV
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                        {(!activePlaylist.targetDevices || activePlaylist.targetDevices.length === 0) 
                                            ? '(Default: Putar di SEMUA TV)' 
                                            : `(${activePlaylist.targetDevices.length} TV Terpilih)`}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {devices.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 italic">Belum ada TV yang terdaftar...</p>
                                    ) : (
                                        devices.map(device => {
                                            const isTargeted = activePlaylist.targetDevices?.includes(device.device_id);
                                            return (
                                                <button
                                                    key={device.device_id}
                                                    onClick={() => {
                                                        const currentTargets = activePlaylist.targetDevices || [];
                                                        const newTargets = isTargeted
                                                            ? currentTargets.filter(id => id !== device.device_id)
                                                            : [...currentTargets, device.device_id];
                                                        handleUpdatePlaylist(activePlaylist.id, { targetDevices: newTargets });
                                                    }}
                                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                                                        isTargeted
                                                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <Tv size={12} />
                                                    {device.device_name}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Track List */}
                        <div className="flex-1 overflow-y-auto">
                            {activePlaylist.tracks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 text-slate-300">
                                    <Disc size={48} className="mb-3 opacity-40" />
                                    <p className="font-semibold text-slate-400 text-sm">Playlist ini masih kosong</p>
                                    <p className="text-xs text-slate-400 mt-1">Upload atau pilih audio dari galeri di atas</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm table-fixed">
                                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12">#</th>
                                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul Track</th>
                                            <th className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Durasi</th>
                                            <th className="px-5 py-2.5 w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activePlaylist.tracks.map((track, idx) => (
                                            <tr key={track.id} className="group border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3.5 font-mono text-xs text-slate-300 font-bold">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleTogglePreview(track.id, track.url)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                                playingTrackId === track.id 
                                                                    ? 'bg-emerald-500 text-white shadow-md' 
                                                                    : 'bg-slate-100 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-500'
                                                            }`}
                                                            title={playingTrackId === track.id ? 'Stop Pratinjau' : 'Putar Pratinjau'}
                                                        >
                                                            {playingTrackId === track.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-700 text-sm truncate">{track.title}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{track.url.split('/').pop()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-500 font-bold">
                                                    {formatDuration(track.duration || 0)}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <button
                                                        onClick={() => handleDeleteTrack(activePlaylist.id, track.id)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition border border-transparent hover:border-red-100"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal for ScheduleManager */}
                        {isScheduleModalOpen && activePlaylist && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                                <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Calendar size={20} className="text-emerald-500" />
                                                Jadwal Putar: {activePlaylist.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">Atur kapan playlist ini akan diputar otomatis</p>
                                        </div>
                                        <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto">
                                        <ScheduleManager config={config} setConfig={setConfig} forcedPlaylistId={activePlaylist.id} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal for CDN Quran Browser */}
                        {isCdnModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                                <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                <Globe size={18} className="text-indigo-400" />
                                                Download Murrotal dari CDN
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Pilih reciter &amp; surah → download lokal → tambah ke playlist <span className="text-indigo-300 font-semibold">"{activePlaylist?.name}"</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsCdnModalOpen(false)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 overflow-y-auto flex-1">
                                        <QuranBrowser
                                            mosqueKey={mosqueKey}
                                            onAddToPlaylist={(tracks) => {
                                                if (!activePlaylist) return;
                                                const newTracks = tracks.map(t => ({
                                                    id: t.id,
                                                    title: t.title,
                                                    url: t.url,
                                                    duration: undefined as any,
                                                }));
                                                handleUpdatePlaylist(activePlaylist.id, {
                                                    tracks: [...activePlaylist.tracks, ...newTracks],
                                                });
                                                setIsCdnModalOpen(false);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <Disc size={32} className="opacity-50" />
                        </div>
                        <p className="font-semibold text-slate-400 text-sm">Pilih playlist untuk mengedit</p>
                        <p className="text-xs text-slate-400 mt-1">atau buat playlist baru di sebelah kiri</p>
                    </div>
                )}
            </div>
        </div>
    );
}
