
import { LogEntry } from '@mosque-digital-clock/shared-types';

type LogLevel = 'info' | 'warn' | 'error' | 'success';

export async function standaloneLog(level: LogLevel, message: string, metadata?: any) {
    try {
        import { getApiBaseUrl } from './constants';

        export async function standaloneLog(level: LogLevel, message: string, metadata?: any) {
            try {
                let apiUrl = '/api/logs';

                if (typeof window !== 'undefined') {
                    const baseUrl = getApiBaseUrl();
                    apiUrl = `${baseUrl}/api/logs`;
                }

                await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        level,
                        source: 'client',
                        message,
                        metadata
                    })
                });
            } catch (e) {
                console.error('Standalone Logger failed:', e);
            }
        }

        export const logger = {
            info: (msg: string, metadata?: any) => standaloneLog('info', msg, metadata),
            success: (msg: string, metadata?: any) => standaloneLog('success', msg, metadata),
            warn: (msg: string, metadata?: any) => standaloneLog('warn', msg, metadata),
            error: (msg: string, metadata?: any) => standaloneLog('error', msg, metadata),
        };
