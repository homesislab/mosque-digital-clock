import { NextResponse } from 'next/server';
import { audioStatusManager } from '../../../../lib/audio-status';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-clock-client, x-device-id',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    const status = audioStatusManager.getStatus(key);
    return NextResponse.json(status || { isPlaying: false });
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    try {
        const body = await request.json();
        audioStatusManager.updateStatus(key, body);

        // Check for pending commands (like remote logout)
        if (audioStatusManager.hasPendingLogout(key)) {
            return NextResponse.json({ success: true, command: 'logout' });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
