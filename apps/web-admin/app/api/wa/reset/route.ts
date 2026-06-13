import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';
import { validateAccess } from '@/lib/auth';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key');

    if (!mosqueKey) {
        return NextResponse.json({ success: false, message: 'Key required' }, { status: 400 });
    }

    const access = await validateAccess(mosqueKey);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status });
    }

    try {
        console.log(`[WA-API][${mosqueKey}] Reset request received`);
        await waService.resetSession(mosqueKey);
        return NextResponse.json({ success: true, message: 'Session reset successfully' });
    } catch (error: any) {
        console.error(`[WA-API][${mosqueKey}] Reset failed:`, error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
