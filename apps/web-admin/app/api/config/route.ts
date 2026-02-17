export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { cookies } from 'next/headers';
import { findUserById } from '../../../lib/user-store';
import pool from '../../../lib/db';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-clock-client, x-device-id',
};

// Default Config (Fallback)
const defaultConfig: MosqueConfig = {
    mosqueInfo: {
        name: 'Masjid Al-Falah',
        address: 'Jl. Ahmad Yani No. 123, Surabaya',
    },
    display: {
        theme: 'dark',
        showSeconds: true,
        showHijriDate: true,
    },
    prayerTimes: {
        calculationMethod: 'Kemenag',
        coordinates: {
            lat: -6.2088,
            lng: 106.8456,
        },
        adjustments: {
            subuh: 2,
            dzuhur: 2,
            ashar: 2,
            maghrib: 2,
            isya: 2,
        },
    },
    iqamah: {
        enabled: true,
        waitTime: {
            subuh: 10,
            dzuhur: 10,
            ashar: 10,
            maghrib: 10,
            isya: 10,
        },
        displayDuration: 10,
    },
    adzan: {
        duration: 4,
    },
    sholat: {
        duration: 10,
    },
    sliderImages: [
        'https://images.unsplash.com/photo-1542204625-ca960ca44635?q=80&w=2670',
        'https://images.unsplash.com/photo-1596492789643-2cb06f50c766?q=80&w=2669',
    ],
    runningText: [
        'Mohon luruskan dan rapatkan shaf.',
        'Matikan alat komunikasi saat berada di dalam masjid.',
        'Kajian rutin ba\'da Maghrib: Tafsir Jalalain bersama Ustadz fulan.'
    ],
    audio: {
        enabled: true,
        playlists: [],
        schedules: [],
        globalUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    officers: [
        { role: "Khatib", name: "Ust. Fulan" },
        { role: "Imam", name: "Ust. Fulan" },
        { role: "Muadzin", name: "Sdr. Ahmad" },
        { role: "Bilal", name: "Sdr. Budi" }
    ],
    finance: {
        totalBalance: 15000000,
        lastUpdated: new Date().toISOString().split('T')[0],
        accounts: [
            { name: 'Kas Utama', balance: 15000000, income: 2500000, expense: 1000000 }
        ]
    },
    gallery: []
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

async function getConfig(key: string): Promise<MosqueConfig> {
    try {
        const [rows]: any = await pool.query(
            'SELECT config_json FROM mosque_configs WHERE mosque_key = ?',
            [key]
        );
        if (rows.length > 0) {
            return JSON.parse(rows[0].config_json);
        }

        // If not found, create with default
        await pool.query(
            'INSERT IGNORE INTO mosque_configs (mosque_key, config_json) VALUES (?, ?)',
            [key, JSON.stringify(defaultConfig)]
        );
        return defaultConfig;
    } catch (error) {
        console.error(`Error fetching config for ${key}:`, error);
        return defaultConfig;
    }
}

async function saveConfig(key: string, config: MosqueConfig) {
    try {
        await pool.query(
            'INSERT INTO mosque_configs (mosque_key, config_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)',
            [key, JSON.stringify(config)]
        );
    } catch (error) {
        console.error(`Error saving config for ${key}:`, error);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    const isClient = request.headers.get('x-clock-client') === 'true';
    if (isClient) {
        const deviceId = request.headers.get('x-device-id');
        if (!deviceId) {
            return NextResponse.json({ success: false, message: 'Device ID required' }, { status: 403, headers: corsHeaders });
        }
        // Verify device status
        try {
            const [deviceRows]: any = await pool.query(
                'SELECT status FROM devices WHERE device_id = ? AND mosque_key = ?',
                [deviceId, key]
            );

            // CHICKEN-AND-EGG FIX: 
            // If device is not found, allow the first fetch so it can register itself.
            // Only block if explicitly marked as 'blocked'.
            if (deviceRows.length > 0 && deviceRows[0].status === 'blocked') {
                return NextResponse.json({ success: false, message: 'Device blocked' }, { status: 403, headers: corsHeaders });
            }
        } catch (dbError) {
            console.error('Database connection error in device check:', dbError);
            // On DB error, we should probably allow access or fail gracefully (return 503)
            // Returning 503 allows client to retry
            return NextResponse.json({ success: false, message: 'Database Unavailable' }, { status: 503, headers: corsHeaders });
        }


    } else {
        const access = await validateAccess(request, key);
        if (!access.allowed) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
        }
    }

    const config = await getConfig(key);
    return NextResponse.json(config, {
        headers: corsHeaders,
    });
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    const access = await validateAccess(request, key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
    }

    const body = await request.json();
    const currentConfig = await getConfig(key);
    const newConfig = { ...currentConfig, ...body };
    await saveConfig(key, newConfig);

    return NextResponse.json(newConfig, {
        headers: corsHeaders,
    });
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: corsHeaders,
    });
}
