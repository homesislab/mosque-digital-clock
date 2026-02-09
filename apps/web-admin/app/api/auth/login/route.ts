import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail } from '../../../../lib/user-store';

export async function POST(request: Request) {
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
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
