import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { cookies } from 'next/headers';
import { findUserById } from '../../../lib/user-store';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-clock-client, x-device-id',
};

async function validateAccess(request: Request, key: string) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin-session')?.value;

    if (!userId) return { allowed: false, status: 401 };

    const user = await findUserById(userId);
    if (!user || (!user.mosqueKeys.includes(key) && key !== 'default')) {
        return { allowed: false, status: 403 };
    }

    return { allowed: true, userId };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ success: false, message: 'Key required' }, { status: 400, headers: corsHeaders });
    }

    const access = await validateAccess(request, key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM devices WHERE mosque_key = ? AND status = \'active\' ORDER BY last_seen DESC',
            [key]
        );
        return NextResponse.json(rows, {
            headers: corsHeaders,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { deviceId, mosqueKey, deviceName } = body;

    if (!deviceId || !mosqueKey) {
        return NextResponse.json({ success: false, message: 'ID and Key required' }, { status: 400, headers: corsHeaders });
    }

    try {
        await pool.query(
            `INSERT INTO devices (device_id, mosque_key, device_name, status) 
             VALUES (?, ?, ?, 'active') 
             ON DUPLICATE KEY UPDATE 
                mosque_key = VALUES(mosque_key), 
                device_name = VALUES(device_name),
                status = IF(status = 'blocked', 'blocked', 'active')`,
            [deviceId, mosqueKey, deviceName || 'TV Device']
        );
        return NextResponse.json({ success: true }, {
            headers: corsHeaders,
        });
    } catch (error) {
        console.error('Device API Error:', error);
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const key = searchParams.get('key');

    if (!deviceId || !key) {
        return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400, headers: corsHeaders });
    }

    const access = await validateAccess(request, key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
    }

    try {
        // Set to blocked instead of deleting to prevent auto-re-registration
        await pool.query('UPDATE devices SET status = \'blocked\' WHERE device_id = ? AND mosque_key = ?', [deviceId, key]);
        return NextResponse.json({ success: true }, {
            headers: corsHeaders,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: corsHeaders,
    });
}
