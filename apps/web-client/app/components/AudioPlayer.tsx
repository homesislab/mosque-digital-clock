'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Volume2, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playlist } from '@mosque-digital-clock/shared-types';
import { resolveUrl } from '../lib/constants';

interface AudioPlayerProps {
    url?: string;
    playlist?: Playlist;
    isPlaying: boolean;
    onStop?: () => void;
}

export const AudioPlayer = ({ url, playlist, isPlaying, onStop }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Playlist State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    // Determine effective source
    const effectiveUrl = playlist
        ? resolveUrl(playlist.tracks[currentTrackIndex]?.url)
        : url;

    const currentTitle = playlist
        ? `${playlist.name}: ${playlist.tracks[currentTrackIndex]?.title}`
        : 'Audio Pengingat / Murrotal Aktif';

    // Reset playlist index when playlist changes (id comparison)
    useEffect(() => {
        setCurrentTrackIndex(0);
    }, [playlist?.id]);

    // Sync isPaused with prop isPlaying
    useEffect(() => {
        setIsPaused(!isPlaying);
    }, [isPlaying]);

    useEffect(() => {
        setLoadError(null);
    }, [effectiveUrl, isPlaying]);

    useEffect(() => {
        if (!audioRef.current || !effectiveUrl) return;

        if (isPlaying && !isPaused) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed:", error);
                    // Auto-advance on error? Maybe not safest, but useful for playlists
                });
            }
        } else {
            audioRef.current.pause();
            if (!isPlaying) {
                // If stopped completely
                if (playlist) setCurrentTrackIndex(0); // Reset playlist
                audioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying, isPaused, effectiveUrl, playlist]);

    // Handlers
    const handleNext = () => {
        if (!playlist) return;
        if (currentTrackIndex < playlist.tracks.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
        } else {
            // End of playlist
            if (onStop) onStop();
        }
    };

    const handlePrev = () => {
        if (!playlist) return;
        if (currentTrackIndex > 0) {
            setCurrentTrackIndex(prev => prev - 1);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);

        const handleEnded = () => {
            if (playlist) {
                handleNext();
            } else {
                if (onStop) onStop();
            }
        };

        const handleError = (e: any) => {
            const err = audio.error;
            let msg = "Unknown Audio Error";
            if (err) {
                switch (err.code) {
                    case 1: msg = "Aborted"; break;
                    case 2: msg = "Network Error"; break;
                    case 3: msg = "Decode Error"; break;
                    case 4: msg = "Source Not Supported"; break;
                }
                setLoadError(`[${err.code}] ${msg}`);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [onStop, effectiveUrl, playlist, currentTrackIndex]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsPaused(!isPaused);
            } else if (e.code === 'Escape') {
                if (onStop) onStop();
            } else if (e.code === 'ArrowRight' && playlist) {
                handleNext();
            } else if (e.code === 'ArrowLeft' && playlist) {
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaused, onStop, isPlaying, playlist, currentTrackIndex]);

    if (!effectiveUrl) return null;

    // Hidden Audio Element for "Headless" playback if UI is hidden? 
    // But we always show UI when playing.

    // Format helper
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] px-8 pb-8 pointer-events-none">
            <audio ref={audioRef} src={effectiveUrl} />

            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-center gap-6"
                    >
                        <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400 border border-emerald-500/30">
                            <Volume2 size={24} />
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-end">
                                <span className={`${loadError ? 'text-red-400 font-bold' : 'text-white/60'} text-xs font-medium uppercase tracking-wider truncate max-w-[200px] sm:max-w-md`}>
                                    {loadError ? `Gagal: ${loadError}` : currentTitle}
                                </span>
                                {!loadError && <span className="text-emerald-400 font-mono text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>}
                            </div>

                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                {loadError ? (
                                    <div className="h-full bg-red-500/50 w-full animate-pulse" />
                                ) : (
                                    <motion.div
                                        className="h-full bg-emerald-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                        transition={{ ease: "linear" }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                            {playlist && (
                                <button
                                    onClick={handlePrev}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors disabled:opacity-30"
                                    disabled={currentTrackIndex === 0}
                                >
                                    <SkipBack size={20} fill="currentColor" />
                                </button>
                            )}

                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                                title="Space"
                            >
                                {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                            </button>

                            {playlist && (
                                <button
                                    onClick={handleNext}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors disabled:opacity-30"
                                    disabled={currentTrackIndex >= playlist.tracks.length - 1}
                                >
                                    <SkipForward size={20} fill="currentColor" />
                                </button>
                            )}

                            <button
                                onClick={() => onStop?.()}
                                className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-500 transition-colors border border-red-500/30 ml-2"
                                title="Esc"
                            >
                                <Square size={24} fill="currentColor" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
