export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/session-store';

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user;
        const keys = user.mosqueKeys;
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
