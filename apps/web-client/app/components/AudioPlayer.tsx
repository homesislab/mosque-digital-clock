'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioPlayerProps {
    url?: string;
    isPlaying: boolean;
    onStop?: () => void;
}

export const AudioPlayer = ({ url, isPlaying, onStop }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Sync isPaused with prop isPlaying
    useEffect(() => {
        setIsPaused(!isPlaying);
    }, [isPlaying]);

    useEffect(() => {
        if (!audioRef.current || !url) return;

        if (isPlaying && !isPaused) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.error("Playback failed:", error));
            }
        } else {
            audioRef.current.pause();
            if (!isPlaying) {
                audioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying, isPaused, url]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            if (onStop) onStop();
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [onStop]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsPaused(!isPaused);
            } else if (e.code === 'Escape') {
                if (onStop) onStop();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaused, onStop]);

    if (!url) return null;
    if (!isPlaying) return (
        <audio ref={audioRef} src={url} preload="auto" />
    );

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] px-8 pb-8 pointer-events-none">
            <audio ref={audioRef} src={url} />

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
                                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Audio Pengingat / Murrotal Aktif</span>
                                <span className="text-emerald-400 font-mono text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>

                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentTime / duration) * 100}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                                title="Space"
                            >
                                {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                            </button>
                            <button
                                onClick={() => onStop?.()}
                                className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-500 transition-colors border border-red-500/30"
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
