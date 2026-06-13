
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function POST(request: Request) {
    const access = await requireSession();
    if (!access.allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: access.status });
    }
    try {
        const { apiUrl, token, message, systemInstruction } = await request.json();

        if (!apiUrl || !token || !message) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Call Wabot Chat/AI endpoint
        const wabotUrl = `${apiUrl.replace(/\/$/, '')}/api/ai/chat`;

        const res = await fetch(wabotUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, systemInstruction })
        });

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.error || 'Chat failed' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
