'use client';

import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveUrl } from '../lib/constants';

interface InfoSliderProps {
    config: MosqueConfig;
    isMuted?: boolean;
}

type SlideType = 
    | { type: 'IMAGE'; url: string } 
    | { type: 'JUMAT'; data: any } 
    | { type: 'OFFICERS' } 
    | { type: 'FINANCE' } 
    | { type: 'KAJIAN' } 
    | { type: 'STREAM' };

export const InfoSlider = memo(({ config, isMuted = false }: InfoSliderProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const adv = config.advancedDisplay;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Helper: Convert YouTube URL to Embed format
    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com/embed/')) return url;
        let videoId = '';
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) videoId = watchMatch[1];
        else {
            const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
            if (shortMatch) videoId = shortMatch[1];
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&playlist=${videoId}&loop=1&controls=0&rel=0&modestbranding=1&enablejsapi=1`;
        }
        return url;
    };

    // Friday schedule logic — memoized to avoid sort on every render
    const activeJumat = useMemo(() => {
        if (!config.jumat || config.jumat.length === 0) return null;
        const todayStr = new Date().toISOString().split('T')[0];
        const sorted = [...config.jumat].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const upcoming = sorted.find(j => (j.date || '') >= todayStr);
        return upcoming || sorted[sorted.length - 1];
    }, [config.jumat]);

    // Streaming flags
    const isStreamingEnabled = config.videoStreaming?.enabled && config.videoStreaming?.url;
    const isStreamingOnly = isStreamingEnabled && !config.videoStreaming?.showInSlideshow;

    // Build playlist — memoized, only rebuilds when config content changes
    const playlist = useMemo<SlideType[]>(() => {
        if (isStreamingOnly) return [{ type: 'STREAM' }];

        const list: SlideType[] = [
            ...(config.sliderImages || []).map(url => ({ type: 'IMAGE' as const, url })),
        ];

        if (activeJumat && config.jumatEnabled !== false) {
            list.push({ type: 'JUMAT', data: activeJumat });
        }

        if (config.kajian?.enabled && config.kajian?.schedule?.length > 0) {
            list.push({ type: 'KAJIAN' });
            (config.kajian.schedule || []).forEach((k: any) => {
                if (k.imageUrl) list.push({ type: 'IMAGE', url: k.imageUrl });
            });
        }

        if (config.officers && config.officers.length > 0 && config.officersEnabled !== false) {
            list.push({ type: 'OFFICERS' });
        }

        if (config.finance && config.finance.enabled !== false) {
            list.push({ type: 'FINANCE' });
        }

        if (isStreamingEnabled && config.videoStreaming?.showInSlideshow) {
            list.push({ type: 'STREAM' });
        }

        return list;
    }, [
        config.sliderImages,
        config.jumat,
        config.jumatEnabled,
        config.kajian,
        config.officers,
        config.officersEnabled,
        config.finance,
        config.videoStreaming,
        activeJumat,
        isStreamingEnabled,
        isStreamingOnly,
    ]);

    const [bgImage, setBgImage] = useState<string>(config.sliderImages?.[0] || '');

    // YouTube JS API Control
    useEffect(() => {
        const currentSlide = playlist[currentIndex];
        if (currentSlide?.type !== 'STREAM' || !iframeRef.current) return;
        
        const manualMuted = config.videoStreaming?.muted ?? false;
        const manualPaused = config.videoStreaming?.paused ?? false;
        const finalMuted = isMuted || manualMuted;

        const sendCommand = (func: string, args: any[] = []) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func,
                    args
                }), '*');
            }
        };

        if (finalMuted) sendCommand('mute'); else sendCommand('unMute');
        if (manualPaused) sendCommand('pauseVideo'); else sendCommand('playVideo');

    }, [isMuted, config.videoStreaming?.muted, config.videoStreaming?.paused, currentIndex, playlist]);

    useEffect(() => {
        if (playlist.length === 0) return;

        const currentSlide = playlist[currentIndex];
        if (currentSlide.type === 'IMAGE') {
            setBgImage(currentSlide.url);
        }

        const isStream = currentSlide.type === 'STREAM';
        const duration = isStream 
            ? (config.videoStreaming?.durationMinutes || 2) * 60000 
            : 15000;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length);
        }, duration);

        return () => clearInterval(timer);
    }, [playlist, currentIndex, config.videoStreaming?.durationMinutes]);

    if (playlist.length === 0) return null;

    const currentSlide = playlist[currentIndex];
    const isInfoSlide = currentSlide.type !== 'IMAGE' && currentSlide.type !== 'STREAM';

    return (
        <div className="w-full h-full relative overflow-hidden bg-zinc-950">
            {/* Background Layer — single AnimatePresence, no heavy blur */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={bgImage}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {bgImage ? (
                        <img
                            src={resolveUrl(bgImage)}
                            className="w-full h-full object-cover"
                            alt="Background"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-900" />
                    )}
                    {/* Overlay — use background-color only (no blur) for GPU savings */}
                    <div
                        className="absolute inset-0 transition-all duration-1000"
                        style={{
                            backgroundColor: isInfoSlide
                                ? (adv?.slideshowOverlayColor || 'rgba(0,0,0,0.8)')
                                : 'transparent',
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content Layer — only animate slide content, not the background again */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentSlide.type === 'JUMAT' && (
                        <motion.div
                            key="jumat"
                            className="w-full max-w-5xl flex flex-col items-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-emerald-400 text-xl font-bold uppercase tracking-[0.3em] mb-4">Jadwal Jumat</span>
                            <h2 className="text-6xl font-black text-white mb-12 border-b-4 border-emerald-500 pb-4">
                                {currentSlide.data.date ? new Date(currentSlide.data.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </h2>
                            <div className="grid grid-cols-3 gap-8 w-full">
                                {[
                                    { label: 'Khotib', val: currentSlide.data.khotib },
                                    { label: 'Imam', val: currentSlide.data.imam },
                                    { label: 'Muadzin', val: currentSlide.data.muadzin },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 rounded-3xl text-center shadow-2xl">
                                        <p className="text-emerald-300 text-sm font-bold uppercase mb-2 tracking-widest">{item.label}</p>
                                        <p className="text-3xl font-black text-white">{item.val || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {currentSlide.type === 'KAJIAN' && (
                        <motion.div
                            key="kajian"
                            className="w-full max-w-6xl flex flex-col items-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="text-4xl font-black text-white mb-10 uppercase tracking-widest drop-shadow-lg">✨ Jadwal Kajian Rutin ✨</h3>
                            <div className="grid grid-cols-2 gap-6 w-full max-h-[70vh] overflow-y-auto px-4">
                                {(config.kajian?.schedule || []).map((kj: any, idx: number) => (
                                    <div key={idx} className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-3xl flex gap-6 items-center shadow-xl">
                                        <div className="bg-emerald-500/20 w-24 h-24 rounded-2xl flex flex-col items-center justify-center text-emerald-300">
                                            <span className="text-xs font-bold uppercase">{kj.day}</span>
                                            <span className="text-lg font-black">{kj.time}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white">{kj.title}</h4>
                                            <p className="text-emerald-400 font-bold">Ustadz {kj.speaker}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {currentSlide.type === 'OFFICERS' && (
                        <motion.div
                            key="officers"
                            className="w-full max-w-5xl flex flex-col items-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="text-4xl font-black text-emerald-400 mb-10 uppercase tracking-widest">Petugas Masjid</h3>
                            <div className="grid grid-cols-2 gap-6 w-full">
                                {config.officers.map((off, idx) => (
                                    <div key={idx} className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-3xl flex flex-col shadow-xl">
                                        <span className="text-xs text-emerald-300 font-bold uppercase tracking-widest opacity-70">{off.role}</span>
                                        <span className="text-3xl font-black text-white">{off.name}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {currentSlide.type === 'FINANCE' && (
                        <motion.div
                            key="finance"
                            className="w-full max-w-6xl"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="grid grid-cols-12 gap-10 items-center">
                                <div className="col-span-12 lg:col-span-5 text-center">
                                    <div className="bg-emerald-600/30 backdrop-blur-sm p-12 rounded-[3.5rem] border border-emerald-400/30 shadow-2xl">
                                        <p className="text-emerald-200 text-sm font-bold uppercase tracking-widest mb-2">Total Saldo Kas</p>
                                        <p className="text-6xl font-black text-white tracking-tighter">
                                            Rp {(config.finance.totalBalance || 0).toLocaleString('id-ID')}
                                        </p>
                                        <p className="mt-8 text-xs text-white/50 italic">Update terakhir: {config.finance.lastUpdated}</p>
                                    </div>
                                </div>
                                <div className="col-span-12 lg:col-span-7 space-y-4">
                                    {config.finance.accounts?.slice(0, 4).map((acc: any, idx: number) => (
                                        <div key={idx} className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-3xl flex justify-between items-center">
                                            <div>
                                                <h4 className="text-2xl font-black text-white uppercase">{acc.name}</h4>
                                                <p className="text-xs text-emerald-400 font-bold tracking-widest">SALDO AKHIR</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-white">Rp {(acc.balance || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentSlide.type === 'STREAM' && (
                        <motion.div
                            key="stream"
                            className="absolute inset-0 w-full h-full bg-black"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <iframe
                                ref={iframeRef}
                                src={getYouTubeEmbedUrl(config.videoStreaming?.url || '')}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                                title="Live Stream"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

InfoSlider.displayName = 'InfoSlider';
