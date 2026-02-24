import { NextResponse } from 'next/server';
import { waService } from '@/lib/wa-service';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key') || 'default';

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
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
