import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key') || 'default';

    try {
        console.log(`[WA-API][${mosqueKey}] Reset request received`);
        await waService.resetSession(mosqueKey);
        return NextResponse.json({ success: true, message: 'Session reset successfully' });
    } catch (error: any) {
        console.error(`[WA-API][${mosqueKey}] Reset failed:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
