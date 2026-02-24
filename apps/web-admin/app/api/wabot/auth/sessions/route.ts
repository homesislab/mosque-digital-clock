
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const apiUrl = searchParams.get('apiUrl');
    const token = searchParams.get('token');

    if (!apiUrl || !token) {
        return NextResponse.json({ error: 'Missing apiUrl or token' }, { status: 400 });
    }

    try {
        const baseUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/sessions$/, '').replace(/\/sessions$/, '').replace(/\/api$/, '');
        const wabotUrl = `${baseUrl}/api/sessions`;

        console.log(`[WabotSessions] Calling: ${wabotUrl}`);

        const res = await fetch(wabotUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[WabotSessions] Failed with status ${res.status}: ${errBody}`);
            return NextResponse.json({ error: 'Failed to fetch sessions', details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
