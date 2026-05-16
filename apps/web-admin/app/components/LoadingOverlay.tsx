'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
    /** Whether to show as full-screen overlay or inline block */
    fullScreen?: boolean;
    className?: string;
}

/**
 * LoadingOverlay: Full-screen or inline loading state component.
 * Replaces ad-hoc loading patterns scattered across the admin dashboard.
 */
export function LoadingOverlay({
    isVisible,
    message = 'Memuat data...',
    fullScreen = false,
    className = '',
}: LoadingOverlayProps) {
    if (!isVisible) return null;

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm font-semibold text-slate-600 text-center">{message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium text-slate-500">{message}</span>
        </div>
    );
}

/**
 * Inline skeleton loader for table rows / list items
 */
export function SkeletonRow({ cols = 3 }: { cols?: number }) {
    return (
        <div className="flex gap-4 animate-pulse py-3 px-4 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-slate-200 rounded flex-1"
                    style={{ maxWidth: i === 0 ? '80px' : undefined }}
                />
            ))}
        </div>
    );
}
