
import { useCallback } from 'react';

type LogLevel = 'info' | 'warn' | 'error' | 'success';

export function useLogger(source: 'client' | 'admin' = 'admin') {

    const log = useCallback(async (level: LogLevel, message: string, metadata?: any) => {
        try {
            // Admin is always on the server origin
            const apiUrl = '/api/logs';

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
