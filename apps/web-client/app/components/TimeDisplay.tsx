'use client';

import { useState, useEffect } from 'react';

interface TimeDisplayProps {
    className?: string;
    style?: React.CSSProperties;
    time?: Date | null;
    clockWeight?: 'light' | 'normal' | 'bold';
    glowColor?: string;
}

export const TimeDisplay = ({ className = '', style, time: externalTime, clockWeight = 'bold', glowColor }: TimeDisplayProps) => {
    const weightMap = {
        'light': 300,
        'normal': 500,
        'bold': 800
    };

    const combinedStyle: React.CSSProperties = {
        ...style,
        fontWeight: weightMap[clockWeight] || 800,
        textShadow: glowColor ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}44` : style?.textShadow
    };
    const [internalTime, setInternalTime] = useState<Date | null>(null);

    useEffect(() => {
        if (externalTime) return;
        setInternalTime(new Date());
        const interval = setInterval(() => {
            setInternalTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, [externalTime]);

    const displayTime = externalTime || internalTime;

    if (!displayTime) return null; // Hydration mismatch prevention

    const formatTime = (date: Date | null | undefined) => {
        if (!date || isNaN(date.getTime())) return '--:--:--';
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).replace(/\./g, ':');
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const timeStr = formatTime(displayTime);

    return (
        <div
            className={className}
            style={style}
            role="timer"
            aria-label={`Waktu sekarang: ${timeStr}`}
            aria-live="off"
        >
            {timeStr}
        </div>
    );
};
