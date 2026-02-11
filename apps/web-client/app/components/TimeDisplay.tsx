'use client';

import { useState, useEffect } from 'react';

interface TimeDisplayProps {
    className?: string;
    style?: React.CSSProperties;
}

export const TimeDisplay = ({ className = '', style }: TimeDisplayProps) => {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return null; // Hydration mismatch prevention

    const formatTime = (date: Date) => {
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

    const timeStr = formatTime(time);

    return (
        <div className={className} style={style}>
            {timeStr}
        </div>
    );
};
