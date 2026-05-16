'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import { Playlist } from '@mosque-digital-clock/shared-types';
import { resolveUrl } from '../lib/constants';

interface AudioPlayerProps {
    url?: string;
    playlist?: Playlist;
    isPlaying: boolean;
    onStop?: () => void;
    onBlocked?: (blocked: boolean) => void;
    playbackState?: 'playing' | 'paused' | 'stopped';
    onCommand?: (command: string) => void;
}

export const AudioPlayer = ({ url, playlist, isPlaying, onStop, onBlocked, playbackState, onCommand }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const lastTimeRef = useRef(0); // throttle timeupdate

    // Remote Control Effect
    useEffect(() => {
        if (playbackState === 'paused') setIsPaused(true);
        else if (playbackState === 'playing') setIsPaused(false);
        else if (playbackState === 'stopped') onStop?.();
    }, [playbackState, onStop]);

    // Effective source
    const effectiveUrl = playlist
        ? resolveUrl(playlist.tracks[currentTrackIndex]?.url)
        : url;

    const currentTitle = playlist
        ? `${playlist.name}: ${playlist.tracks[currentTrackIndex]?.title}`
        : 'Audio Pengingat';

    // Reset track on playlist change
    useEffect(() => { setCurrentTrackIndex(0); }, [playlist?.id]);

    // Target device check
    const [isTargetDevice, setIsTargetDevice] = useState(true);
    useEffect(() => {
        if (!playlist?.targetDevices?.length) { setIsTargetDevice(true); return; }
        const did = localStorage.getItem('deviceId') || 'unknown-device';
        setIsTargetDevice(playlist.targetDevices.includes(did));
    }, [playlist?.id, playlist?.targetDevices]);

    const effectiveIsPlaying = isPlaying && isTargetDevice;
    useEffect(() => { setIsPaused(!effectiveIsPlaying); }, [effectiveIsPlaying]);
    useEffect(() => { setLoadError(null); }, [effectiveUrl, effectiveIsPlaying]);

    // Playback control
    useEffect(() => {
        if (!audioRef.current || !effectiveUrl) return;
        if (effectiveIsPlaying && !isPaused) {
            const p = audioRef.current.play();
            p?.then(() => onBlocked?.(false))
              .catch(err => {
                  if (err.name === 'NotAllowedError') onBlocked?.(true);
                  else setLoadError(err.message);
              });
        } else {
            audioRef.current.pause();
            if (!isPlaying) {
                if (playlist) setCurrentTrackIndex(0);
                audioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying, isPaused, effectiveUrl, playlist]);

    const handleNext = useCallback(() => {
        if (!playlist) return;
        if (currentTrackIndex < playlist.tracks.length - 1) setCurrentTrackIndex(p => p + 1);
        else onStop?.();
    }, [playlist, currentTrackIndex, onStop]);

    const handlePrev = useCallback(() => {
        if (!playlist || currentTrackIndex === 0) return;
        setCurrentTrackIndex(p => p - 1);
    }, [playlist, currentTrackIndex]);

    // Audio event listeners — throttle timeupdate to 1s interval to reduce re-renders
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const now = audio.currentTime;
            if (Math.abs(now - lastTimeRef.current) >= 1) {
                lastTimeRef.current = now;
                setCurrentTime(Math.floor(now));
            }
        };
        const handleDuration = () => setDuration(audio.duration || 0);
        const handleEnded = () => { playlist ? handleNext() : onStop?.(); };
        const handleError = () => {
            const err = audio.error;
            if (!err) return;
            const msgs: Record<number, string> = { 1: 'Aborted', 2: 'Network Error', 3: 'Decode Error', 4: 'Not Supported' };
            setLoadError(`[${err.code}] ${msgs[err.code] || 'Unknown'}`);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [onStop, effectiveUrl, playlist, handleNext]);

    // Heartbeat — increased to 10s to reduce API load
    useEffect(() => {
        if (!isPlaying) return;
        const key = new URLSearchParams(window.location.search).get('key') || 'default';

        const report = () => {
            fetch(`/api/audio/active-status?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isPlaying: true,
                    title: currentTitle,
                    currentTime,
                    duration,
                    playlistId: playlist?.id,
                }),
            }).then(r => r.json()).then(d => { if (d.command) onCommand?.(d.command); }).catch(() => {});
        };

        report();
        const interval = setInterval(report, 10000); // was 5s → now 10s
        return () => {
            clearInterval(interval);
            fetch(`/api/audio/active-status?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPlaying: false, currentTime: 0, duration: 0 }),
            }).catch(() => {});
        };
    }, [isPlaying, currentTitle, playlist?.id]); // removed currentTime/duration from deps → no re-register every second

    // Keyboard shortcuts
    useEffect(() => {
        if (!isPlaying) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Space') { e.preventDefault(); setIsPaused(p => !p); }
            else if (e.code === 'Escape') onStop?.();
            else if (e.code === 'ArrowRight' && playlist) handleNext();
            else if (e.code === 'ArrowLeft' && playlist) handlePrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isPlaying, onStop, playlist, handleNext, handlePrev]);

    if (!effectiveUrl) return null;

    const formatTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-10 left-6 z-[100] pointer-events-none">
            <audio ref={audioRef} src={effectiveUrl} preload="auto" />

            {isPlaying && (
                <div
                    className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 shadow-lg"
                    style={{ minWidth: 0, maxWidth: '260px' }}
                >
                    {/* Progress bar — top edge */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 transition-none"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Play/Pause */}
                    <button
                        onClick={() => setIsPaused(p => !p)}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        {isPaused
                            ? <Play size={14} fill="currentColor" />
                            : <Pause size={14} fill="currentColor" />
                        }
                    </button>

                    {/* Title + time */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-semibold leading-tight truncate ${loadError ? 'text-red-400' : 'text-white/80'}`}>
                            {loadError ? `Err: ${loadError}` : currentTitle}
                        </p>
                        {!loadError && (
                            <p className="text-[9px] font-mono text-white/30 mt-0.5 tabular-nums">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </p>
                        )}
                    </div>

                    {/* Prev / Next (only for playlist) */}
                    {playlist && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={currentTrackIndex === 0}
                                className="flex-shrink-0 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
                            >
                                <SkipBack size={12} fill="currentColor" />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentTrackIndex >= playlist.tracks.length - 1}
                                className="flex-shrink-0 text-white/40 hover:text-white disabled:opacity-10 transition-colors"
                            >
                                <SkipForward size={12} fill="currentColor" />
                            </button>
                        </>
                    )}

                    {/* Stop */}
                    <button
                        onClick={() => onStop?.()}
                        className="flex-shrink-0 text-red-400/50 hover:text-red-400 transition-colors"
                    >
                        <Square size={12} fill="currentColor" stroke="none" />
                    </button>
                </div>
            )}
        </div>
    );
};
