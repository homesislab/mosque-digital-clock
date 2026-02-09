'use client';

import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
    url?: string;
    isPlaying: boolean;
}

export const AudioPlayer = ({ url, isPlaying }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (!audioRef.current || !url) return;

        if (isPlaying) {
            // Attempt to play
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Automatic playback started!
                    })
                    .catch((error) => {
                        // Auto-play might be blocked by browser policy
                        console.error("Audio Auto-play prevented:", error);
                    });
            }
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset
        }
    }, [isPlaying, url]);

    if (!url) return null;

    return (
        <audio ref={audioRef} src={url} preload="auto" />
    );
};
