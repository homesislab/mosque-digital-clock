export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '../../../../lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('admin-session')?.value;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [rows]: any = await pool.query(
            `SELECT u.id, u.email, GROUP_CONCAT(mk.mosque_key) as mosqueKeys 
             FROM users u 
             LEFT JOIN mosque_keys mk ON u.id = mk.user_id 
             WHERE u.id = ? 
             GROUP BY u.id`,
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];
        const keys = user.mosqueKeys ? user.mosqueKeys.split(',') : [];
        const mosqueKey = keys.length > 0 ? keys[0] : 'default';

        return NextResponse.json({
            id: user.id,
            email: user.email,
            mosqueKey: mosqueKey,
            mosqueKeys: keys
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
