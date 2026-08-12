export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { validateAccess as validateSessionAccess } from '../../../lib/auth';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-clock-client, x-device-id',
};

async function validateAccess(request: Request, key: string) {
    void request;
    return validateSessionAccess(key);
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
        console.error('Device GET error:', error);
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
        // Verify mosqueKey exists
        const [keyRows] = await pool.query<any[]>(
            'SELECT mosque_key FROM mosque_configs WHERE mosque_key = ? LIMIT 1',
            [mosqueKey]
        );
        if (keyRows.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid mosque key' }, { status: 403, headers: corsHeaders });
        }

        // Check if device already paired to a different mosque
        const [existing] = await pool.query<any[]>(
            'SELECT mosque_key, status FROM devices WHERE device_id = ? LIMIT 1',
            [deviceId]
        );
        if (existing.length > 0) {
            if (existing[0].mosque_key !== mosqueKey) {
                return NextResponse.json(
                    { success: false, message: 'Device already paired to another mosque' },
                    { status: 409, headers: corsHeaders }
                );
            }
            if (existing[0].status === 'blocked') {
                return NextResponse.json(
                    { success: false, message: 'Device is blocked' },
                    { status: 403, headers: corsHeaders }
                );
            }
            // Same mosque, update last_seen
            await pool.query(
                'UPDATE devices SET device_name = ?, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?',
                [deviceName || 'TV Device', deviceId]
            );
            return NextResponse.json({ success: true }, { headers: corsHeaders });
        }

        await pool.query(
            `INSERT INTO devices (device_id, mosque_key, device_name, status) 
             VALUES (?, ?, ?, 'active')`,
            [deviceId, mosqueKey, deviceName || 'TV Device']
        );
        return NextResponse.json({ success: true }, { headers: corsHeaders });
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
        console.error('Device DELETE error:', error);
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function PUT(request: Request) {
    const body = await request.json();
    const { deviceId, deviceName, key } = body;

    if (!deviceId || !key) {
        return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400, headers: corsHeaders });
    }

    const access = await validateAccess(request, key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
    }

    try {
        await pool.query(
            'UPDATE devices SET device_name = ? WHERE device_id = ? AND mosque_key = ?',
            [deviceName || 'TV Device', deviceId, key]
        );
        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (error) {
        console.error('Device PUT error:', error);
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: corsHeaders,
    });
}
