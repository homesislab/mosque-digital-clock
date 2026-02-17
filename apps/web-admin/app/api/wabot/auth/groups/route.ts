
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const apiUrl = searchParams.get('apiUrl');
    const token = searchParams.get('token');
    const sessionId = searchParams.get('sessionId');

    if (!apiUrl || !token || !sessionId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const wabotUrl = `${apiUrl.replace(/\/$/, '')}/api/sessions/${sessionId}/groups`;

        const res = await fetch(wabotUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch groups' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
