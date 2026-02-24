import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key') || 'default';

    try {
        const info = waService.getStatus(mosqueKey);
        const groups = info.status === 'CONNECTED' ? await waService.getGroups(mosqueKey) : [];
        return NextResponse.json({ ...info, groups });
    } catch (error) {
        return NextResponse.json({ status: 'ERROR', error: 'Service not initialized' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key') || 'default';

    try {
        console.log(`[WA-API][${mosqueKey}] Manual startup request received`);
        waService.init(mosqueKey);
        return NextResponse.json({ success: true, message: 'Initialization started' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
