import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';
import { validateAccess } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key');

    if (!mosqueKey) {
        return NextResponse.json({ status: 'ERROR', error: 'Key required' }, { status: 400 });
    }

    const access = await validateAccess(mosqueKey);
    if (!access.allowed) {
        return NextResponse.json({ status: 'ERROR', error: 'Unauthorized' }, { status: access.status });
    }

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
    const mosqueKey = searchParams.get('key');

    if (!mosqueKey) {
        return NextResponse.json({ success: false, message: 'Key required' }, { status: 400 });
    }

    const access = await validateAccess(mosqueKey);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status });
    }

    try {
        console.log(`[WA-API][${mosqueKey}] Manual startup request received`);
        waService.init(mosqueKey);
        return NextResponse.json({ success: true, message: 'Initialization started' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
