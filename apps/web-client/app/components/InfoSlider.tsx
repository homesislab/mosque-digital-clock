'use client';

import { MosqueConfig } from '@mosque-digital-clock/shared-types';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveUrl } from '../lib/constants';

interface InfoSliderProps {
    config: MosqueConfig;
}

type SlideType = { type: 'IMAGE'; url: string } | { type: 'OFFICERS' } | { type: 'FINANCE' };

export const InfoSlider = ({ config }: InfoSliderProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Generate Playlist: Images -> Officers -> Finance -> Repeat
    const playlist: SlideType[] = [
        ...(config.sliderImages || []).map(url => ({ type: 'IMAGE' as const, url })),
    ];

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
        }, 10000); // Change slide every 10 seconds

        return () => clearInterval(timer);
    }, [playlist.length]);

    if (playlist.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                No content configured
            </div>
        );
    }

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
                            transition={{ duration: 10, ease: "linear" }}
                        />
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
                        <h3 className="text-5xl font-bold mb-12 text-amber-500 border-b-2 border-amber-500/30 pb-6 tracking-wide drop-shadow-lg uppercase">
                            Petugas Sholat Jumat
                        </h3>
                        <div className="w-full max-w-4xl grid grid-cols-2 gap-8">
                            {config.officers.map((officer, idx) => (
                                <div key={idx} className="flex flex-col bg-gradient-to-br from-white/5 to-white/[0.02] p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl group hover:border-amber-500/50 transition-colors">
                                    <span className="text-xl text-amber-200/80 font-medium mb-2 uppercase tracking-widest">{officer.role}</span>
                                    <span className="text-4xl font-bold text-white tracking-tight">{officer.name}</span>
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
                        <h3 className="text-5xl font-bold mb-12 text-amber-500 border-b-2 border-amber-500/30 pb-6 tracking-wide drop-shadow-lg uppercase">
                            Laporan Keuangan
                        </h3>
                        <div className="w-full max-w-5xl space-y-8">
                            <div className="bg-gradient-to-r from-amber-900/40 to-black/40 p-10 rounded-3xl border border-amber-500/30 text-center shadow-2xl backdrop-blur-md">
                                <p className="text-amber-100/60 text-xl font-medium mb-2 uppercase tracking-widest">Saldo Akhir</p>
                                <p className="text-8xl font-bold text-amber-400 tracking-tighter drop-shadow-[0_0_35px_rgba(245,158,11,0.3)]">
                                    Rp {config.finance.balance.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center shadow-xl">
                                    <p className="text-zinc-400 text-lg mb-2 uppercase tracking-widest">Pemasukan Minggu Ini</p>
                                    <p className="text-4xl font-bold text-emerald-400">
                                        + Rp {config.finance.income.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center shadow-xl">
                                    <p className="text-zinc-400 text-lg mb-2 uppercase tracking-widest">Pengeluaran Minggu Ini</p>
                                    <p className="text-4xl font-bold text-rose-400">
                                        - Rp {config.finance.expense.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-center text-zinc-500 text-lg mt-8 font-light italic">
                                Data per tanggal: {config.finance.lastUpdated}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
