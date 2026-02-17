'use client';

import { useState, useEffect } from 'react';
import { MosqueConfig, Playlist, AudioTrack } from '@mosque-digital-clock/shared-types';
import { Plus, Trash2, Music, Disc, ChevronRight, UploadCloud, Library, Play, Pause, X } from 'lucide-react';
// import { resolveUrl } from '../lib/utils'; // logic is inline at bottom of file

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

    // Helpers
    const getPlaylists = () => config.audio?.playlists || [];

    const activePlaylist = getPlaylists().find(p => p.id === activePlaylistId);

    const updateConfigPlaylists = (newPlaylists: Playlist[]) => {
        setConfig({
            ...config,
            audio: {
                ...config.audio,
                playlists: newPlaylists
            }
        });
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
            // Also remove schedules referencing this playlist
            const newSchedules = (config.audio?.schedules || []).filter(s => s.playlistId !== id);

            setConfig({
                ...config,
                audio: {
                    ...config.audio,
                    playlists: newPlaylists,
                    schedules: newSchedules
                }
            });
            if (activePlaylistId === id) setActivePlaylistId(null);
        }
    };

    const handleUpdatePlaylist = (id: string, updates: Partial<Playlist>) => {
        const newPlaylists = getPlaylists().map(p =>
            p.id === id ? { ...p, ...updates } : p
        );
        updateConfigPlaylists(newPlaylists);
    };

    const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                if (audio.duration === Infinity || isNaN(audio.duration)) {
                    resolve(0);
                } else {
                    resolve(audio.duration);
                }
            };
            audio.onerror = () => {
                resolve(0);
            };
            // Force load
            audio.load();
        });
    };

    // Backfill missing durations for existing tracks
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
                        try {
                            const duration = await getAudioDuration(updatedTracks[i].url);
                            updatedTracks[i] = { ...updatedTracks[i], duration };
                            changed = true;
                        } catch (e) {
                            console.warn("Failed to get duration for", updatedTracks[i].url);
                            updatedTracks[i] = { ...updatedTracks[i], duration: 0 };
                            changed = true;
                        }
                    }
                }

                if (changed) {
                    handleUpdatePlaylist(activePlaylistId, { tracks: updatedTracks });
                }
                setProcessingDurations(false);
            };
            process();
        }
    }, [activePlaylistId, config.audio?.playlists]); // Re-run when playlist changes or loads



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
            url: url,
            fileName: fileName,
            duration: duration
        };

        handleUpdatePlaylist(playlistId, {
            tracks: [...playlist.tracks, newTrack]
        });
    };

    const handleDeleteTrack = (playlistId: string, trackId: string) => {
        const playlist = getPlaylists().find(p => p.id === playlistId);
        if (!playlist) return;

        handleUpdatePlaylist(playlistId, {
            tracks: playlist.tracks.filter(t => t.id !== trackId)
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, playlistId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/upload?key=${mosqueKey}`, { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                // handleAddTrack is async now
                await handleAddTrack(playlistId, data.url, file.name.replace(/\.[^/.]+$/, ""));

                // Add to gallery if not exists
                if (!config.gallery?.includes(data.url)) {
                    setConfig({
                        ...config,
                        gallery: [...(config.gallery || []), data.url]
                    });
                }
            } else {
                alert('Upload failed: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* List Sidebar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700">Daftar Playlist</h3>
                    <button
                        onClick={handleCreatePlaylist}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        title="Buat Playlist Baru"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {getPlaylists().length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                            Belum ada playlist.
                        </div>
                    )}
                    {getPlaylists().map(playlist => (
                        <button
                            key={playlist.id}
                            onClick={() => setActivePlaylistId(playlist.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${activePlaylistId === playlist.id
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                                : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                }`}
                        >
                            <div className="min-w-0">
                                <div className="font-bold text-sm truncate">{playlist.name}</div>
                                <div className="flex items-center gap-2 text-xs opacity-70">
                                    <span>{playlist.tracks.length} Tracks</span>
                                    <span>•</span>
                                    <span>{getPlaylistDuration(playlist)}</span>
                                </div>
                            </div>
                            <ChevronRight size={16} className={`transition-transform ${activePlaylistId === playlist.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Edit Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {activePlaylist ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 max-w-md">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Nama Playlist</label>
                                    <input
                                        type="text"
                                        value={activePlaylist.name}
                                        onChange={(e) => handleUpdatePlaylist(activePlaylist.id, { name: e.target.value })}
                                        className="w-full text-xl font-bold text-slate-800 border-none p-0 focus:ring-0 placeholder-slate-300"
                                        placeholder="Nama Playlist..."
                                    />
                                    <div className="text-xs text-slate-400 mt-1 font-mono">
                                        Total Durasi: {getPlaylistDuration(activePlaylist)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeletePlaylist(activePlaylist.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-bold cursor-pointer hover:bg-emerald-100 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <UploadCloud size={16} />
                                    {uploading ? 'Mengupload...' : 'Upload Audio MP3'}
                                    <input type="file" hidden accept="audio/*" onChange={(e) => handleUpload(e, activePlaylist.id)} disabled={uploading} />
                                </label>
                                <button
                                    onClick={() => onPickTrack(activePlaylist.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
                                >
                                    <Library size={16} /> Pilih dari Galeri
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 w-10">#</th>
                                        <th className="px-6 py-3">Judul Track</th>
                                        <th className="px-6 py-3 text-right">Durasi</th>
                                        <th className="px-6 py-3 w-20 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {activePlaylist.tracks.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                                Playlist ini masih kosong. Tambahkan audio track.
                                            </td>
                                        </tr>
                                    )}
                                    {activePlaylist.tracks.map((track, idx) => (
                                        <tr key={track.id} className="group hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-mono text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{track.title}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{track.url.split('/').pop()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                {formatDuration(track.duration || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteTrack(activePlaylist.id, track.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                        <Disc size={64} className="mb-4 opacity-50" />
                        <p className="font-medium">Pilih playlist untuk mengedit</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple fallback if you prefer using a prop
function resolveUrl(url: string, key?: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url; // In admin we typically just use the string or rely on the same logic as client if imported
}
