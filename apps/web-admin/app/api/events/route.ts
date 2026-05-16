import { NextRequest } from 'next/server';
import { broadcaster } from '../../../lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mosqueKey = searchParams.get('key') || 'default';
    const deviceId = req.headers.get('x-device-id') || searchParams.get('deviceId') || 'unknown-' + Math.random().toString(36).substr(2, 9);
    
    // CORS headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-device-id, x-clock-client',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    const stream = new ReadableStream({
        start(controller) {
            broadcaster.addClient(mosqueKey, deviceId, controller);
            
            // Send initial connection success message
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(': connected\n\n'));
        },
        cancel() {
            broadcaster.removeClient(mosqueKey, deviceId);
        },
    });

    return new Response(stream, { headers });
}
