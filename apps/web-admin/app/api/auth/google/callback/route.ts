export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../../../../lib/db';
import { logger } from '../../../../lib/logger-server';

// Google OAuth callback handler
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        if (error) {
            console.error(`[Google Auth] Error from Google: ${error}`);
            return NextResponse.redirect(
                new URL(`/login?error=google_${error}`, process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        if (!code) {
            return NextResponse.redirect(
                new URL('/login?error=no_authorization_code', process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        // Verify state token (CSRF protection)
        const cookieStore = await cookies();
        const storedState = cookieStore.get('oauth_state')?.value;
        
        if (!state || state !== storedState) {
            console.error('[Google Auth] State mismatch - possible CSRF attack');
            return NextResponse.redirect(
                new URL('/login?error=state_mismatch', process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3011'}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('[Google Auth] Token exchange failed:', errorData);
            return NextResponse.redirect(
                new URL('/login?error=token_exchange_failed', process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Get user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (!userResponse.ok) {
            console.error('[Google Auth] Failed to fetch user info');
            return NextResponse.redirect(
                new URL('/login?error=user_info_failed', process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        const googleUser = await userResponse.json();
        const { email, name, picture, id: googleId } = googleUser;
        
        if (!email) {
            return NextResponse.redirect(
                new URL('/login?error=no_email', process.env.NEXTAUTH_URL || request.url)
            );
        }
        
        // ... (database query logic)
        // Find or create user
        const [rows]: any = await pool.query(
            `SELECT u.id, u.email, GROUP_CONCAT(mk.mosque_key) as mosqueKeys 
             FROM users u 
             LEFT JOIN mosque_keys mk ON u.id = mk.user_id 
             WHERE u.email = ? 
             GROUP BY u.id`,
            [email]
        );
        
        let userId: string;
        let mosqueKey: string;
        
        if (rows.length > 0) {
            // User exists - update Google ID if not set
            userId = rows[0].id;
            mosqueKey = rows[0].mosqueKeys?.split(',')[0] || 'default';
            
            // Update Google OAuth info
            await pool.query(
                `UPDATE users SET google_id = ?, google_name = ?, google_picture = ? 
                 WHERE id = ?`,
                [googleId, name, picture, userId]
            );
        } else {
            // Create new user
            userId = uuidv4();
            mosqueKey = `mosque-${Date.now()}`;
            
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                
                // Create user
                await connection.query(
                    `INSERT INTO users (id, email, password_hash, google_id, google_name, google_picture) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, email, '', googleId, name, picture]
                );
                
                // Create mosque key
                await connection.query(
                    `INSERT INTO mosque_keys (user_id, mosque_key) VALUES (?, ?)`,
                    [userId, mosqueKey]
                );
                
                // Create default config
                const defaultConfig = {
                    mosqueInfo: { name: name || 'Masjid Baru', address: '' },
                    display: { theme: 'dark', showSeconds: true, showHijriDate: true },
                    prayerTimes: {
                        calculationMethod: 'Kemenag',
                        coordinates: { lat: -6.2088, lng: 106.8456 },
                        adjustments: { subuh: 2, dzuhur: 2, jumat: 2, ashar: 2, maghrib: 2, isya: 2 }
                    },
                    iqamah: { enabled: true, waitTime: { subuh: 10, dzuhur: 10, jumat: 10, ashar: 10, maghrib: 10, isya: 10 }, displayDuration: 10 },
                    adzan: { duration: 4 },
                    sholat: { duration: 10 },
                    sliderImages: [],
                    runningText: ['Selamat datang di masjid kami'],
                    audio: { enabled: true, playlists: [], schedules: [] },
                    officers: [],
                    finance: { totalBalance: 0, lastUpdated: new Date().toISOString(), accounts: [] },
                    gallery: []
                };
                
                await connection.query(
                    `INSERT INTO mosque_configs (mosque_key, config_json) VALUES (?, ?)`,
                    [mosqueKey, JSON.stringify(defaultConfig)]
                );
                
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
            
            logger.info(`New user registered via Google: ${email}`, { googleId });
        }
        
        // Set session cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        };
        
        cookieStore.set('admin-session', userId, cookieOptions);
        
        // Redirect to dashboard
        return NextResponse.redirect(
            new URL(`/?key=${mosqueKey}`, process.env.NEXTAUTH_URL || request.url)
        );
        
    } catch (error) {
        console.error('[Google Auth] Callback error:', error);
        logger.error('Google OAuth callback failed', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.redirect(
            new URL('/login?error=callback_error', process.env.NEXTAUTH_URL || request.url)
        );
    }
}
