'use client';

import { MosqueConfig } from '@mosque-digital-clock/shared-types';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveUrl } from '../lib/constants';

interface InfoSliderProps {
    config: MosqueConfig;
}

type SlideType = { type: 'IMAGE'; url: string } | { type: 'JUMAT'; data: any } | { type: 'OFFICERS' } | { type: 'FINANCE' } | { type: 'KAJIAN' };

export const InfoSlider = ({ config }: InfoSliderProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Find the most relevant Friday schedule (Today or upcoming)
    const getActiveJumat = () => {
        if (!config.jumat || config.jumat.length === 0) return null;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Sort by date to be sure
        const sorted = [...config.jumat].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        // Find first entry that is today or in the future
        const upcoming = sorted.find(j => (j.date || '') >= todayStr);
        return upcoming || sorted[sorted.length - 1]; // Fallback to last one if all in past
    };

    const activeJumat = getActiveJumat();


    // Generate Playlist
    const playlist: SlideType[] = [
        ...(config.sliderImages || []).map(url => ({ type: 'IMAGE' as const, url })),
    ];

    if (activeJumat) {
        playlist.push({ type: 'JUMAT', data: activeJumat });
    }

    // Add Kajian Slide if enabled and has data
    if (config.kajian?.enabled && config.kajian?.schedule?.length > 0) {
        playlist.push({ type: 'KAJIAN' });

        // Add Kajian Posters immediately after the schedule list
        (config.kajian.schedule || []).forEach((k: any) => {
            if (k.imageUrl) {
                playlist.push({ type: 'IMAGE', url: k.imageUrl });
            }
        });
    }

    if (config.officers && config.officers.length > 0) {
        playlist.push({ type: 'OFFICERS' });
    }
    if (config.finance) {
        playlist.push({ type: 'FINANCE' });
    }

    useEffect(() => {
        if (playlist.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length);
        }, 15000); // Increased to 15s for better readability

        return () => clearInterval(timer);
    }, [playlist.length]);

    if (playlist.length === 0) return null;

    const currentSlide = playlist[currentIndex];

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                {currentSlide.type === 'IMAGE' && (
                    <motion.div
                        key={`img-${currentIndex}`}
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.img
                            src={resolveUrl(currentSlide.url)}
                            alt="Slide"
                            className="w-full h-full object-cover"
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 15, ease: "linear" }}
                        />
                    </motion.div>
                )}

                {currentSlide.type === 'JUMAT' && (
                    <motion.div
                        key="jumat"
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/80 text-white backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-amber-500 text-xs lg:text-xl font-bold mb-2 tracking-[0.2em] lg:tracking-[0.3em] uppercase opacity-80">
                            Jadwal Sholat Jumat
                        </div>
                        <h3 className="text-2xl sm:text-4xl lg:text-6xl font-black mb-8 lg:mb-12 text-white border-b-2 lg:border-b-4 border-amber-500 pb-2 lg:pb-6 tracking-tight drop-shadow-2xl text-center">
                            {currentSlide.data.date ? new Date(currentSlide.data.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Petugas Pekan Ini'}
                        </h3>
                        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8">
                            {[
                                { role: 'Khotib', name: currentSlide.data.khotib },
                                { role: 'Imam', name: currentSlide.data.imam },
                                { role: 'Muadzin', name: currentSlide.data.muadzin }
                            ].map((off, idx) => (
                                <div key={idx} className="flex flex-col bg-white/5 border border-white/10 p-4 lg:p-8 rounded-2xl lg:rounded-3xl backdrop-blur-md shadow-2xl items-center text-center">
                                    <span className="text-amber-400 text-xs lg:text-lg font-bold mb-1 lg:mb-4 uppercase tracking-widest">{off.role}</span>
                                    <span className="text-xl lg:text-4xl font-extrabold text-white leading-tight">{off.name || '-'}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentSlide.type === 'KAJIAN' && (
                    <motion.div
                        key="kajian"
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/80 text-white backdrop-blur-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-2xl lg:text-5xl font-bold mb-8 lg:mb-12 text-cyan-400 border-b-2 border-cyan-500/30 pb-2 lg:pb-6 tracking-wide drop-shadow-lg uppercase text-center flex items-center gap-4">
                            <span>✨</span> Jadwal Kajian Rutin <span>✨</span>
                        </h3>
                        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 overflow-y-auto max-h-[70vh] px-4">
                            {(config.kajian?.schedule || []).map((kj: any, idx: number) => (
                                <div key={idx} className="bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-500/20 p-6 rounded-2xl backdrop-blur-md flex gap-6 items-center shadow-lg group hover:border-cyan-400/50 transition-all">
                                    <div className="flex flex-col items-center justify-center bg-cyan-900/20 w-24 h-24 rounded-xl border border-cyan-500/30 text-cyan-300">
                                        <span className="text-xs font-bold uppercase tracking-widest mb-1">Hari</span>
                                        <span className="text-xl font-black">{kj.day}</span>
                                        <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded-full mt-1 border border-cyan-500/20">{kj.time}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors line-clamp-2">{kj.title}</h4>
                                        <div className="flex items-center gap-2 text-cyan-100/60 text-sm lg:text-lg font-medium">
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs uppercase tracking-wider">Pemateri</span>
                                            {kj.speaker}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentSlide.type === 'OFFICERS' && (
                    <motion.div
                        key="officers"
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/80 text-white backdrop-blur-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-2xl lg:text-5xl font-bold mb-8 lg:mb-12 text-emerald-500 border-b-2 border-emerald-500/30 pb-2 lg:pb-6 tracking-wide drop-shadow-lg uppercase text-center">
                            Petugas & Pengurus Masjid
                        </h3>
                        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
                            {config.officers.map((officer, idx) => (
                                <div key={idx} className="flex flex-col bg-gradient-to-br from-white/5 to-white/[0.02] p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl group hover:border-emerald-500/50 transition-colors">
                                    <span className="text-xs lg:text-xl text-emerald-200/80 font-medium mb-1 lg:mb-2 uppercase tracking-widest">{officer.role}</span>
                                    <span className="text-xl lg:text-4xl font-bold text-white tracking-tight">{officer.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentSlide.type === 'FINANCE' && (
                    <motion.div
                        key="finance"
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/80 text-white backdrop-blur-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-2xl lg:text-5xl font-bold mb-6 lg:mb-10 text-amber-500 border-b-2 border-amber-500/30 pb-2 lg:pb-4 tracking-wide drop-shadow-lg uppercase text-center">
                            Laporan Keuangan Masjid
                        </h3>

                        <div className="w-full max-w-6xl grid grid-cols-12 gap-6 lg:gap-10 items-start overflow-y-auto">
                            {/* Summary Section */}
                            <div className="col-span-12 lg:col-span-5 space-y-4 lg:space-y-6">
                                <div className="bg-gradient-to-br from-amber-700/40 to-black/60 p-6 lg:p-10 rounded-2xl lg:rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)] backdrop-blur-md">
                                    <p className="text-amber-100/60 text-sm lg:text-lg font-medium mb-1 uppercase tracking-widest text-center">Total Seluruh Saldo</p>
                                    <p className="text-4xl lg:text-7xl font-black text-amber-400 tracking-tighter drop-shadow-[0_0_35px_rgba(245,158,11,0.3)] text-center">
                                        Rp {(config.finance.totalBalance || (config.finance as any).balance || 0).toLocaleString('id-ID')}
                                    </p>
                                    <div className="mt-4 lg:mt-8 pt-4 lg:pt-8 border-t border-white/10 flex items-center justify-between text-zinc-400 text-[10px] lg:text-sm italic">
                                        <span>Update: {config.finance.lastUpdated}</span>
                                        <span className="bg-emerald-500/20 text-emerald-400 px-2 lg:px-3 py-1 rounded-full text-[8px] lg:text-[10px] font-bold uppercase not-italic border border-emerald-500/30 tracking-widest">
                                            Laporan Resmi
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 text-center space-y-2">
                                    <p className="text-amber-200/50 text-base italic leading-relaxed">
                                        "Infakkanlah sebagian dari harta yang Kami rizkikan kepadamu sebelum datang kematian."
                                    </p>
                                    <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold font-mono">QS. Al-Munafiqun: 10</p>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="col-span-12 lg:col-span-7 space-y-4">
                                {config.finance.accounts?.length ? (
                                    config.finance.accounts.slice(0, 4).map((acc: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md flex justify-between items-center group hover:bg-white/10 transition-all shadow-xl">
                                            <div className="flex-1">
                                                <h4 className="text-lg lg:text-2xl font-bold text-white mb-1 lg:mb-2 group-hover:text-amber-400 transition-colors">{acc.name || 'Akun/Dana'}</h4>
                                                <div className="flex flex-col sm:flex-row sm:gap-6 text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em]">
                                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                        Masuk: Rp {(acc.income || 0).toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-rose-400 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                                        Keluar: Rp {(acc.expense || 0).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-zinc-500 text-[8px] lg:text-[10px] mb-0 lg:mb-1 uppercase tracking-widest font-bold">Saldo Akhir</p>
                                                <p className="text-xl lg:text-4xl font-black text-amber-500 tracking-tight">
                                                    Rp {(acc.balance || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/20 opacity-30">
                                        <p className="text-2xl font-bold">Tidak ada rincian akun</p>
                                        <p className="text-sm">Silakan tambahkan akun di panel admin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
