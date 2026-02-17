'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Music, MousePointerClick } from 'lucide-react';

interface AudioUnlockOverlayProps {
    isVisible: boolean;
    onUnlock: () => void;
}

export const AudioUnlockOverlay = ({ isVisible, onUnlock }: AudioUnlockOverlayProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onUnlock}
                    className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-3xl flex items-center justify-center cursor-pointer group"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/10 border border-white/20 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-8 max-w-lg text-center mx-4"
                    >
                        <div className="relative">
                            <div className="p-8 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Volume2 size={64} strokeWidth={1.5} />
                            </div>
                            <span className="absolute -top-2 -right-2 flex h-6 w-6">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-400"></span>
                            </span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Aktifkan Suara</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                Klik di mana saja untuk mengaktifkan pemutaran audio otomatis di aplikasi ini.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-[0.2em] text-sm bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
                            <MousePointerClick size={20} />
                            <span>Klik untuk Mulai</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
