export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail } from '../../../../lib/user-store';
import { httpRequestsTotal, httpRequestDuration } from '../../../../lib/metrics';

export async function POST(request: Request) {
    const start = Date.now();
    try {
        const { email, password } = await request.json();
        const user = await findUserByEmail(email);

        if (user && user.passwordHash === password) { // Note: Use hashing in real production
            const cookieStore = await cookies();
            cookieStore.set('admin-session', user.id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return NextResponse.json({ success: true, mosqueKey: user.mosqueKeys[0] });
        }

        return NextResponse.json(
            { success: false, message: 'Email atau password salah' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Login error:', error);
        const response = NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
        return response;
    } finally {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration.observe({ method: 'POST', route: '/api/auth/login', status: 'all' }, duration);
        httpRequestsTotal.inc({ method: 'POST', route: '/api/auth/login', status: 'all' });
    }
}
