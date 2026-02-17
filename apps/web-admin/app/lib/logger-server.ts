
import { LogEntry } from '@mosque-digital-clock/shared-types';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'data');
const LOG_FILE = join(LOG_DIR, 'app.log');

export async function serverLog(level: LogEntry['level'], message: string, source: LogEntry['source'] = 'system', metadata?: any) {
    try {
        if (!existsSync(LOG_DIR)) {
            await mkdir(LOG_DIR, { recursive: true });
        }

        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
            metadata
        };

        await appendFile(LOG_FILE, JSON.stringify(entry) + '\n');
        console.log(`[${level.toUpperCase()}] ${message}`);
    } catch (error) {
        console.error('Server side log failed:', error);
    }
}

export const logger = {
    info: (msg: string, metadata?: any) => serverLog('info', msg, 'system', metadata),
    success: (msg: string, metadata?: any) => serverLog('success', msg, 'system', metadata),
    warn: (msg: string, metadata?: any) => serverLog('warn', msg, 'system', metadata),
    error: (msg: string, metadata?: any) => serverLog('error', msg, 'system', metadata),
};
