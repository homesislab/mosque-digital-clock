export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { RegisterSchema, formatZodErrors } from '@mosque-digital-clock/shared-types';
import { addUser, findUserByEmail } from '../../../../lib/user-store';
import { withRateLimit } from '../../../../lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { createSession, setSessionCookie } from '../../../../lib/session-store';

async function handleRegister(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input with Zod schema
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = formatZodErrors(validation.error.issues as any);
            return NextResponse.json(
                { success: false, message: 'Validation error: ' + errorMessage },
                { status: 400 }
            );
        }

        const { email, password, name } = validation.data;

        if (await findUserByEmail(email)) {
            return NextResponse.json({ success: false, message: 'Email sudah terdaftar' }, { status: 400 });
        }

        const userId = uuidv4();
        const mosqueKey = `mosque-${Math.random().toString(36).substring(2, 10)}`;

        // Hash password with bcrypt (12 salt rounds for strong security)
        const passwordHash = await bcrypt.hash(password, 12);

        await addUser({
            id: userId,
            email,
            passwordHash,
            mosqueKeys: [mosqueKey]
        });

        const maxAge = 60 * 60 * 24 * 7;
        const token = await createSession(userId, maxAge);
        await setSessionCookie(token, maxAge);

        return NextResponse.json({ success: true, mosqueKey });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withRateLimit('/api/auth/register', request, () => handleRegister(request));
}
