
import { useState, useCallback } from 'react';
import { LogEntry } from '@mosque-digital-clock/shared-types';

type LogLevel = 'info' | 'warn' | 'error' | 'success';

// We need to know where to send logs. 
// For Client: It should point to the admin server (cross-origin potentially, but usually same domain in docker)
// For Admin: It points to its own API
// simplistic approach: relative path /api/logs if on same origin, or full URL if configured.

import { getApiBaseUrl } from './constants';

// ... imports

export function useLogger(source: 'client' | 'admin') {

    const log = useCallback(async (level: LogLevel, message: string, metadata?: any) => {
        try {
            let apiUrl = '/api/logs';

            if (typeof window !== 'undefined' && source === 'client') {
                const baseUrl = getApiBaseUrl();
                apiUrl = `${baseUrl}/api/logs`;
            }

            // Fire and forget (mostly)
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level,
                    source,
                    message,
                    metadata
                })
            });

        } catch (e) {
            console.error('Logger failed:', e);
        }
    }, [source]);

    const info = (message: string, metadata?: any) => log('info', message, metadata);
    const warn = (message: string, metadata?: any) => log('warn', message, metadata);
    const error = (message: string, metadata?: any) => log('error', message, metadata);
    const success = (message: string, metadata?: any) => log('success', message, metadata);

    return { info, warn, error, success, log };
}
