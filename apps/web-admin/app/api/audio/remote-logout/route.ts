import { NextResponse } from 'next/server';
import { audioStatusManager } from '../../../../lib/audio-status';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    try {
        audioStatusManager.requestLogout(key);
        return NextResponse.json({ success: true, message: 'Logout request sent to device' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
