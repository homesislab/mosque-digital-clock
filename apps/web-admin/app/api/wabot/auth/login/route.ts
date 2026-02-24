
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { apiUrl, username, password } = await request.json();

        if (!apiUrl || !username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Call Wabot Login
        // Assuming Wabot API is at /api/auth/login relative to apiUrl
        const baseUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/auth\/login$/, '').replace(/\/auth\/login$/, '').replace(/\/api$/, '');
        const wabotUrl = `${baseUrl}/api/auth/login`;

        console.log(`[WabotLogin] Calling: ${wabotUrl}`);

        const res = await fetch(wabotUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[WabotLogin] Failed with status ${res.status}: ${errBody}`);
            try {
                const err = JSON.parse(errBody);
                return NextResponse.json({ error: err.error || 'Login failed', details: errBody }, { status: res.status });
            } catch (e) {
                return NextResponse.json({ error: 'Login failed', details: errBody }, { status: res.status });
            }
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
