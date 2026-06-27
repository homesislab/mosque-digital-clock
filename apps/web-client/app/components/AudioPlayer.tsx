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
    const lastTimeRef = useRef(0);

    // Internal refs to track actual audio state without triggering re-renders
    const isPlayingRef = useRef(false);
    const isPausedRef = useRef(false);
    const currentSrcRef = useRef('');

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

    // Sync isPaused state when effectiveIsPlaying changes
    useEffect(() => {
        if (!effectiveIsPlaying) {
            setIsPaused(true);
        }
        // Don't auto-resume paused state when effectiveIsPlaying becomes true —
        // that is handled by the playback control effect below.
    }, [effectiveIsPlaying]);

    // Clear error when src changes
    useEffect(() => { setLoadError(null); }, [effectiveUrl]);

    // ─── CORE PLAYBACK CONTROL ───────────────────────────────────────────────
    // This effect ONLY runs when the audio source (URL/track) changes.
    // It loads the new src and immediately plays if we should be playing.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !effectiveUrl) return;

        // Only reload if the src actually changed — prevents glitch on unrelated re-renders
        if (currentSrcRef.current !== effectiveUrl) {
            currentSrcRef.current = effectiveUrl;
            audio.src = effectiveUrl;
            audio.load();
        }

        // After loading, decide whether to play based on current state
        if (effectiveIsPlaying && !isPaused) {
            const p = audio.play();
            p?.then(() => {
                isPlayingRef.current = true;
                onBlocked?.(false);
            }).catch(err => {
                if (err.name === 'NotAllowedError') onBlocked?.(true);
                else setLoadError(err.message);
            });
        } else {
            audio.pause();
            isPlayingRef.current = false;
            if (!isPlaying) {
                if (playlist) setCurrentTrackIndex(0);
                audio.currentTime = 0;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveUrl]); // ← Only re-run when src changes. Play/pause handled separately below.

    // ─── PLAY / PAUSE TOGGLE ─────────────────────────────────────────────────
    // Separate effect that ONLY handles play/pause transitions without reloading src.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !effectiveUrl) return;

        const shouldPlay = effectiveIsPlaying && !isPaused;

        if (shouldPlay && !isPlayingRef.current) {
            const p = audio.play();
            p?.then(() => {
                isPlayingRef.current = true;
                onBlocked?.(false);
            }).catch(err => {
                if (err.name === 'NotAllowedError') onBlocked?.(true);
                else setLoadError(err.message);
            });
        } else if (!shouldPlay && isPlayingRef.current) {
            audio.pause();
            isPlayingRef.current = false;
            if (!isPlaying) {
                if (playlist) setCurrentTrackIndex(0);
                audio.currentTime = 0;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveIsPlaying, isPaused]); // ← Only re-run on play/pause state change.

    // ─── GESTURE RESUME (fix blocked autoplay / broken unlock) ───────────────
    // Browser autoplay policy blocks audio-with-sound until a user gesture.
    // After ANY gesture (including tapping the "Aktifkan Suara" overlay), retry
    // play() so murottal/adzan actually starts instead of sitting paused at 0:00.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const tryResume = () => {
            if (effectiveIsPlaying && !isPaused && audio.paused) {
                const p = audio.play();
                p?.then(() => { isPlayingRef.current = true; onBlocked?.(false); })
                 .catch(() => {});
            }
        };
        window.addEventListener('pointerdown', tryResume);
        window.addEventListener('touchstart', tryResume);
        window.addEventListener('keydown', tryResume);
        return () => {
            window.removeEventListener('pointerdown', tryResume);
            window.removeEventListener('touchstart', tryResume);
            window.removeEventListener('keydown', tryResume);
        };
    }, [effectiveIsPlaying, isPaused, onBlocked]);

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
        // Track when browser actually starts/stops playing
        const handlePlay = () => { isPlayingRef.current = true; };
        const handlePause = () => { isPlayingRef.current = false; };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [onStop, playlist, handleNext]);

    // Heartbeat — 10s interval
    useEffect(() => {
        if (!isPlaying) return;
        const key = new URLSearchParams(window.location.search).get('key') || 'default';

        // Use refs for currentTime/duration inside interval to avoid re-registering every second
        const currentTimeRef = { current: currentTime };
        const durationRef = { current: duration };

        const report = () => {
            fetch(`/api/audio/active-status?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isPlaying: true,
                    title: currentTitle,
                    currentTime: currentTimeRef.current,
                    duration: durationRef.current,
                    playlistId: playlist?.id,
                }),
            }).then(r => r.json()).then(d => { if (d.command) onCommand?.(d.command); }).catch(() => {});
        };

        report();
        const interval = setInterval(report, 10000);
        return () => {
            clearInterval(interval);
            fetch(`/api/audio/active-status?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPlaying: false, currentTime: 0, duration: 0 }),
            }).catch(() => {});
        };
    }, [isPlaying, currentTitle, playlist?.id]); // currentTime/duration intentionally excluded

    // Keep ref in sync for heartbeat (without re-registering the interval)
    const currentTimeForHeartbeat = useRef(currentTime);
    const durationForHeartbeat = useRef(duration);
    useEffect(() => { currentTimeForHeartbeat.current = currentTime; }, [currentTime]);
    useEffect(() => { durationForHeartbeat.current = duration; }, [duration]);

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
            {/* Audio element: src is now managed imperatively via ref, not as a reactive prop */}
            <audio ref={audioRef} preload="auto" />

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
                        onClick={() => {
                            const audio = audioRef.current;
                            const next = !isPaused;
                            setIsPaused(next);
                            if (!audio) return;
                            if (next) {
                                audio.pause();
                                isPlayingRef.current = false;
                            } else {
                                // Called directly inside the click gesture so the
                                // browser reliably unlocks audio on a single tap.
                                const p = audio.play();
                                p?.then(() => { isPlayingRef.current = true; onBlocked?.(false); })
                                 .catch(err => { if (err.name === 'NotAllowedError') onBlocked?.(true); else setLoadError(err.message); });
                            }
                        }}
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
