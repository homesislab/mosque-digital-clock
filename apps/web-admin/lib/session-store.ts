import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import type { RowDataPacket } from 'mysql2';
import pool from './db';
import { findUserById, type User } from './user-store';

export const SESSION_COOKIE_NAME = 'admin-session';
const DEFAULT_IDLE_SECONDS = 60 * 60 * 24;

interface SessionRow extends RowDataPacket {
    userId: string;
    expiresAt: Date;
    idleExpiresAt: Date;
}

export interface SessionUser {
    sessionToken: string;
    user: User;
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
    userId: string,
    maxAgeSeconds: number,
    idleSeconds = Math.min(maxAgeSeconds, DEFAULT_IDLE_SECONDS)
): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);

    await pool.query(
        `INSERT INTO admin_sessions
            (token_hash, user_id, expires_at, idle_expires_at)
         VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))`,
        [tokenHash, userId, maxAgeSeconds, idleSeconds]
    );

    return token;
}

export async function setSessionCookie(token: string, maxAgeSeconds: number): Promise<void> {
    (await cookies()).set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
    });
}

export async function getSessionUser(): Promise<SessionUser | undefined> {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return undefined;

    const tokenHash = hashToken(token);
    const [rows] = await pool.query<SessionRow[]>(
        `SELECT user_id AS userId, expires_at AS expiresAt, idle_expires_at AS idleExpiresAt
         FROM admin_sessions
         WHERE token_hash = ?
           AND revoked_at IS NULL
           AND expires_at > UTC_TIMESTAMP()
           AND idle_expires_at > UTC_TIMESTAMP()
         LIMIT 1`,
        [tokenHash]
    );

    const session = rows[0] as SessionRow | undefined;
    if (!session) return undefined;

    const user = await findUserById(session.userId);
    if (!user) return undefined;

    const remainingAbsoluteSeconds = Math.max(
        0,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
    );
    const idleSeconds = Math.min(DEFAULT_IDLE_SECONDS, remainingAbsoluteSeconds);
    if (idleSeconds > 0) {
        await pool.query(
            `UPDATE admin_sessions
             SET last_used_at = UTC_TIMESTAMP(),
                 idle_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND)
             WHERE token_hash = ? AND revoked_at IS NULL`,
            [idleSeconds, tokenHash]
        );
    }

    return { sessionToken: token, user };
}

export async function revokeCurrentSession(): Promise<void> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
        await pool.query(
            `UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP()
             WHERE token_hash = ? AND revoked_at IS NULL`,
            [hashToken(token)]
        );
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
}
