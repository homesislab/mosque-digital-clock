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
                    className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center cursor-none"
                >
                    <div className="flex flex-col items-center justify-center space-y-8 opacity-90">
                        {/* Silhouette Image */}
                        <div className="relative w-48 h-48 lg:w-64 lg:h-64 mb-6 invert">
                            <img
                                src="/praying-silhouette.png"
                                alt="Sholat"
                                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            />
                        </div>

                        <div className="text-center space-y-4">
                            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-[0.5em] uppercase drop-shadow-lg">
                                Sholat
                            </h1>
                            <div className="h-1 w-32 bg-amber-500 mx-auto rounded-full"></div>
                            <p className="text-xl lg:text-3xl text-slate-300 tracking-widest font-light">
                                Sedang Berlangsung... Harap Tenang
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
