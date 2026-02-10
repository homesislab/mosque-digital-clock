export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { addUser, findUserByEmail } from '../../../../lib/user-store';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (await findUserByEmail(email)) {
            return NextResponse.json({ success: false, message: 'Email sudah terdaftar' }, { status: 400 });
        }

        const userId = uuidv4();
        const mosqueKey = `mosque-${Math.random().toString(36).substring(2, 10)}`;

        await addUser({
            id: userId,
            email,
            passwordHash: password, // Note: Use hashing in real production
            mosqueKeys: [mosqueKey]
        });

        const cookieStore = await cookies();
        cookieStore.set('admin-session', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.json({ success: true, mosqueKey });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
