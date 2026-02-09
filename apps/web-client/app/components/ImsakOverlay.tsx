'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Clock } from 'lucide-react';

interface ImsakOverlayProps {
    isVisible: boolean;
    secondsRemaining: number;
}

export const ImsakOverlay = ({ isVisible, secondsRemaining }: ImsakOverlayProps) => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Animated Glow Background */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
                    </div>

                    <div className="relative z-10 text-center px-8">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center mb-8"
                        >
                            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
                                <Moon size={48} className="text-amber-400 fill-amber-400/20" />
                            </div>
                            <h2 className="text-5xl font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">
                                Waktu Imsak
                            </h2>
                            <div className="h-1.5 w-32 bg-amber-500 rounded-full mt-4 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                            className="mb-12"
                        >
                            <div className="text-[18vw] font-black text-amber-500 font-mono leading-none tracking-tighter tabular-nums drop-shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                                {timeString}
                            </div>
                            <div className="text-2xl text-amber-200/60 font-medium uppercase tracking-[0.3em] -mt-4">
                                Menuju Waktu Subuh
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-2xl mx-auto"
                        >
                            <div className="flex items-center justify-center gap-4 mb-3 text-amber-100">
                                <Clock size={24} className="animate-spin-slow" />
                                <p className="text-3xl font-bold italic">
                                    "Segera akhiri Sahur Anda"
                                </p>
                            </div>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                Mari bersiap untuk menunaikan ibadah puasa hari ini dengan penuh keikhlasan.
                            </p>
                        </motion.div>
                    </div>

                    {/* Decorative Stars/Dots */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white rounded-full opacity-20"
                                style={{
                                    width: Math.random() * 4 + 'px',
                                    height: Math.random() * 4 + 'px',
                                    top: Math.random() * 100 + '%',
                                    left: Math.random() * 100 + '%',
                                    animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
