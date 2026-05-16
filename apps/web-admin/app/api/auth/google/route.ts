export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Initiate Google OAuth login
export async function GET(request: Request) {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return NextResponse.json(
                { error: 'Google OAuth not configured' },
                { status: 500 }
            );
        }
        
        // Generate state token for CSRF protection
        const state = crypto.randomBytes(32).toString('hex');
        
        // Store state in secure cookie
        const cookieStore = await cookies();
        cookieStore.set('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 10, // 10 minutes
        });
        
        // Build Google OAuth URL
        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
        googleAuthUrl.searchParams.set(
            'redirect_uri',
            `${process.env.NEXTAUTH_URL || 'http://localhost:3011'}/api/auth/google/callback`
        );
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'openid email profile');
        googleAuthUrl.searchParams.set('state', state);
        googleAuthUrl.searchParams.set('access_type', 'offline');
        googleAuthUrl.searchParams.set('prompt', 'consent');
        
        return NextResponse.json({ url: googleAuthUrl.toString() });
    } catch (error) {
        console.error('[Google Auth] Initiation error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Google login' },
            { status: 500 }
        );
    }
}
