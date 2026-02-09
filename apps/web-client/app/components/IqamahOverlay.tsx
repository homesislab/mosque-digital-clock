'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface IqamahOverlayProps {
    isVisible: boolean;
    prayerName: string;
    secondsRemaining: number;
}

export const IqamahOverlay = ({ isVisible, prayerName, secondsRemaining }: IqamahOverlayProps) => {
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
                    className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
                >
                    <div className="text-center">
                        <h2 className="text-4xl text-gray-400 mb-4 uppercase tracking-widest">
                            Waktu Iqamah {prayerName}
                        </h2>
                        <div className="text-[15vw] font-bold text-white font-mono leading-none tracking-tighter tabular-nums text-red-500">
                            {timeString}
                        </div>
                        <p className="text-2xl text-gray-500 mt-8 animate-pulse">
                            Mohon gunakan waktu ini untuk sholat sunnah
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
