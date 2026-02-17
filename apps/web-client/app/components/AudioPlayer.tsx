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
    onBlocked?: (blocked: boolean) => void;
}

export const AudioPlayer = ({ url, playlist, isPlaying, onStop, onBlocked }: AudioPlayerProps) => {
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
                playPromise.then(() => {
                    onBlocked?.(false);
                }).catch(error => {
                    console.error("Playback failed:", error);
                    if (error.name === 'NotAllowedError') {
                        onBlocked?.(true);
                    } else {
                        setLoadError(error.message);
                    }
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
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-x-0 bottom-12 z-[100] px-10 pointer-events-none">
            <audio ref={audioRef} src={effectiveUrl} />

            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="max-w-2xl mx-auto bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-full h-14 px-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto flex items-center gap-4 relative overflow-hidden"
                    >
                        {/* Subtle Top Progress Bar */}
                        {!loadError && (
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
                                <motion.div
                                    className="h-full bg-emerald-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                    transition={{ ease: "linear", duration: 0.1 }}
                                />
                            </div>
                        )}

                        {/* 1. Play/Pause Toggle */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                        >
                            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                        </button>

                        {/* 2. Track Title */}
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-xs font-semibold truncate tracking-wide ${loadError ? 'text-red-400' : 'text-white/80'}`}>
                                {loadError ? `Gagal: ${loadError}` : currentTitle}
                            </h3>
                        </div>

                        {/* 3. Time Display */}
                        {!loadError && (
                            <span className="text-[10px] font-mono text-white/30 tabular-nums">
                                {formatTime(currentTime)}
                            </span>
                        )}

                        {/* 4. Controls */}
                        <div className="flex items-center gap-1 border-l border-white/5 pl-4">
                            {playlist && (
                                <>
                                    <button
                                        onClick={handlePrev}
                                        disabled={currentTrackIndex === 0}
                                        className="p-1.5 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
                                    >
                                        <SkipBack size={16} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={currentTrackIndex >= playlist.tracks.length - 1}
                                        className="p-1.5 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
                                    >
                                        <SkipForward size={16} fill="currentColor" />
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => onStop?.()}
                                className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors ml-1"
                            >
                                <Square size={16} fill="currentColor" stroke="none" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
