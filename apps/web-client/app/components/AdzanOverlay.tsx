'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AdzanOverlayProps {
    isVisible: boolean;
    prayerName: string;
}

export const AdzanOverlay = ({ isVisible, prayerName }: AdzanOverlayProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
                >
                    <div className="text-center space-y-6">
                        <motion.h2
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl lg:text-5xl text-amber-500 font-bold uppercase tracking-[0.2em]"
                        >
                            Waktu Adzan
                        </motion.h2>

                        <div className="h-1 w-24 bg-white/20 mx-auto rounded-full"></div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-6xl lg:text-9xl font-bold text-white font-serif tracking-tight drop-shadow-2xl"
                        >
                            {prayerName}
                        </motion.h1>

                        <p className="text-xl text-slate-400 mt-8 animate-pulse tracking-widest uppercase">
                            Silahkan Menjawab Adzan
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-10 left-10 w-32 h-32 border-t-2 border-l-2 border-amber-500/30 rounded-tl-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 border-b-2 border-r-2 border-amber-500/30 rounded-br-3xl"></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
