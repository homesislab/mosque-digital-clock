export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { LoginSchema, formatZodErrors } from '@mosque-digital-clock/shared-types';
import { findUserByEmail } from '../../../../lib/user-store';
import { withRateLimit } from '../../../../lib/rate-limit';
import { httpRequestsTotal, httpRequestDuration } from '../../../../lib/metrics';

async function handleLogin(request: NextRequest) {
    const start = Date.now();
    try {
        const body = await request.json();

        // Validate input with Zod schema
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = formatZodErrors(validation.error.issues as any);
            return NextResponse.json(
                { success: false, message: 'Validation error: ' + errorMessage },
                { status: 400 }
            );
        }

        const { email, password, rememberMe } = validation.data;
        const user = await findUserByEmail(email);

        // Securely compare password using bcrypt
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const cookieStore = await cookies();

            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
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

export async function POST(request: NextRequest) {
    return withRateLimit('/api/auth/login', request, () => handleLogin(request));
}
