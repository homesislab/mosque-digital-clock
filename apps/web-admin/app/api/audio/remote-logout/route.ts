import { NextResponse } from 'next/server';
import { audioStatusManager } from '../../../../lib/audio-status';
import { validateAccess } from '@/lib/auth';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ success: false, message: 'Key required' }, { status: 400 });
    }

    const access = await validateAccess(key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status });
    }

    try {
        audioStatusManager.requestLogout(key);
        return NextResponse.json({ success: true, message: 'Logout request sent to device' });
    } catch (error) {
        console.error('[remote-logout] error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 400 });
    }
}
