import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    className?: string;
}

const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-4',
};

/**
 * Reusable loading spinner with configurable sizes.
 * Uses Tailwind CSS border animation.
 */
export function LoadingSpinner({ size = 'md', color = 'border-emerald-500', className = '' }: LoadingSpinnerProps) {
    const sizeClass = sizeMap[size];
    return (
        <div
            className={`${sizeClass} rounded-full border-slate-200 ${color} border-t-current animate-spin ${className}`}
            role="status"
            aria-label="Memuat..."
        />
    );
}
