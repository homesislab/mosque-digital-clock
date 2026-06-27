import { NextResponse } from 'next/server';
import { audioSyncStatusManager } from '../../../../lib/sync-status';
import { AudioSyncStatus } from '@mosque-digital-clock/shared-types';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-clock-client, x-device-id',
};

// GET ?key=...            -> daftar laporan sync semua perangkat utk mosque key
// GET ?key=...&deviceId=  -> laporan sync satu perangkat
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';
    const deviceId = searchParams.get('deviceId');

    if (deviceId) {
        const status = audioSyncStatusManager.getForDevice(key, deviceId);
        return NextResponse.json(status || null, { headers: corsHeaders });
    }
    return NextResponse.json(audioSyncStatusManager.listForKey(key), { headers: corsHeaders });
}

// POST ?key=...  body: AudioSyncStatus  -> client melaporkan file audio yg tersimpan
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    try {
        const body = (await request.json()) as AudioSyncStatus;
        if (!body || !body.deviceId) {
            return NextResponse.json(
                { success: false, error: 'deviceId required' },
                { status: 400, headers: corsHeaders },
            );
        }
        audioSyncStatusManager.update(key, body);
        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Bad Request' },
            { status: 400, headers: corsHeaders },
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
