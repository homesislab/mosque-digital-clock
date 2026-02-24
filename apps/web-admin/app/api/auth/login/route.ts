export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail } from '../../../../lib/user-store';
import { httpRequestsTotal, httpRequestDuration } from '../../../../lib/metrics';

export async function POST(request: Request) {
    const start = Date.now();
    try {
        const { email, password, rememberMe } = await request.json();
        const user = await findUserByEmail(email);

        if (user && user.passwordHash === password) { // Note: Use hashing in real production
            const cookieStore = await cookies();

            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            };

            if (rememberMe) {
                // 30 days expiration
                cookieOptions.maxAge = 60 * 60 * 24 * 30;
            } else {
                // Default to 1 day expiration if not remembered
                cookieOptions.maxAge = 60 * 60 * 24;
            }

            cookieStore.set('admin-session', user.id, cookieOptions);

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
