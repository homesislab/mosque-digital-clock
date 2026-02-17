import { NextResponse } from 'next/server';
import { LogEntry } from '@mosque-digital-clock/shared-types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { serverLog } from '../../lib/logger-server';

const LOG_DIR = process.env.LOG_DIR || join(process.cwd(), 'data');
const LOG_FILE = join(LOG_DIR, 'app.log');

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { level, source, message, metadata } = body;

        if (!level || !source || !message) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400, headers: corsHeaders() }
            );
        }

        await serverLog(level, message, source, metadata);

        return NextResponse.json({ success: true }, { headers: corsHeaders() });
    } catch (error) {
        console.error('Log API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to log' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

export async function GET(request: Request) {
    try {
        if (!existsSync(LOG_FILE)) {
            return NextResponse.json({ success: true, logs: [] });
        }

        const fileContent = await readFile(LOG_FILE, 'utf-8');
        const lines = fileContent.trim().split('\n');

        // Parse lines, filter out empty ones
        const logs: LogEntry[] = lines
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter((entry): entry is LogEntry => entry !== null)
            .reverse(); // Newest first

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        return NextResponse.json({ success: true, logs: logs.slice(0, limit) }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Log Fetch Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch logs' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
