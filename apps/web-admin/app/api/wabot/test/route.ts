import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';
import { validateAccess } from '@/lib/auth';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key');

    if (!mosqueKey) {
        return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    const access = await validateAccess(mosqueKey);
    if (!access.allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: access.status });
    }

    try {
        const { targetNumber, message, to } = await request.json();
        const recipient = to || targetNumber;

        if (!recipient || !message) {
            return NextResponse.json({ error: 'Missing parameters (to/targetNumber, message)' }, { status: 400 });
        }

        console.log(`[WabotTest][${mosqueKey}] Sending to ${recipient} via local WA Service`);
        await waService.sendMessage(mosqueKey, recipient, message);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(`[WabotTest][${mosqueKey}] Error:`, error.message);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
