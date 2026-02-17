
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { apiUrl, targetNumber, message, sessionId, authToken } = await request.json();

        if (!apiUrl || !targetNumber || !message) {
            return NextResponse.json({ error: 'Missing parameters (apiUrl, targetNumber, message)' }, { status: 400 });
        }

        // Call Wabot Send Message
        // Adjusted to match Wabot API: POST /api/messages/send
        const wabotUrl = `${apiUrl.replace(/\/$/, '')}/api/messages/send`;

        // Payload for Wabot
        const payload = {
            sessionId: sessionId, // Optional if Wabot handles default session or we pass it
            to: targetNumber,
            type: 'TEXT',
            content: message
        };

        const headers: any = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(wabotUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            // Try to parse JSON error
            try {
                const jsonErr = JSON.parse(err);
                return NextResponse.json({ error: jsonErr.error || 'Wabot Error' }, { status: res.status });
            } catch (e) {
                return NextResponse.json({ error: `Wabot Failed (${res.status}): ${err}` }, { status: res.status });
            }
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
