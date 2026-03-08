'use client';

import { useState, useEffect } from 'react';

interface TimeDisplayProps {
    className?: string;
    style?: React.CSSProperties;
    time?: Date | null;
}

export const TimeDisplay = ({ className = '', style, time: externalTime }: TimeDisplayProps) => {
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
        <div className={className} style={style}>
            {timeStr}
        </div>
    );
};
