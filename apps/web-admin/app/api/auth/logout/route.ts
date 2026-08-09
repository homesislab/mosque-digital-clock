export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revokeCurrentSession } from '../../../../lib/session-store';

export async function POST() {
    await revokeCurrentSession();

    return NextResponse.json({ success: true });
}
