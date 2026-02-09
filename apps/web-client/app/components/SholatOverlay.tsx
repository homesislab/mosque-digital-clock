'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SholatOverlayProps {
    isVisible: boolean;
}

export const SholatOverlay = ({ isVisible }: SholatOverlayProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center cursor-none"
                >
                    <div className="text-center opacity-50">
                        <h1 className="text-4xl font-bold text-emerald-700 tracking-[1em] uppercase mb-4">Sholat</h1>
                        <p className="text-xl text-gray-800 tracking-widest">Sedang Berlangsung... Harap Tenang</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
