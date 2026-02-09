'use client';

import { motion } from 'framer-motion';

interface RunningTextProps {
    texts?: string[];
}

export const RunningText = ({ texts = [] }: RunningTextProps) => {
    // If no text, show default or empty
    const content = texts.length > 0
        ? texts.join(' | ')
        : "Mohon luruskan dan rapatkan shaf. | Matikan alat komunikasi.";

    return (
        <div className="overflow-hidden whitespace-nowrap w-full h-full flex items-center">
            <motion.div
                className="inline-block"
                initial={{ x: '100%' }}
                animate={{ x: '-100%' }}
                transition={{
                    repeat: Infinity,
                    ease: 'linear',
                    duration: Math.max(20, content.length / 5), // Dynamic speed
                }}
            >
                <span className="text-xl font-bold px-4 tracking-wider uppercase">
                    {content}
                </span>
            </motion.div>
        </div>
    );
};
