export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { cookies } from 'next/headers';
import { findUserById } from '../../../lib/user-store';
import pool from '../../../lib/db';
import { logger } from '../../lib/logger-server';
import { waService } from '@/lib/wa-service';
import { withRateLimit } from '../../../lib/rate-limit';
import { z } from 'zod';
import { broadcaster } from '../../../lib/events';
import { hydrateConfigWithNormalizedData, persistNormalizedData } from './db-helpers';

// Basic sanitization: strip tags from string values (prevent XSS)
function sanitizeString(value: string): string {
    return value.replace(/<[^>]*>/g, '').trim();
}

function sanitizeObject(obj: any, depth = 0): any {
    if (depth > 10) return obj; // Prevent infinite recursion
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item, depth + 1));
    if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = sanitizeObject(obj[key], depth + 1);
        }
        return sanitized;
    }
    return obj;
}

// Validate POST body is a valid JSON object (not an array or primitive)
const ConfigBodySchema = z.record(z.string(), z.any());

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-clock-client, x-device-id',
};

// Default Config (Fallback)
const defaultConfig: MosqueConfig = {
    mosqueInfo: {
        name: 'Mosque',
        address: '',
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
            jumat: 2,
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
            jumat: 10,
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
        'https://mosque.homesislab.my.id/defaults/makkah.png',
        'https://mosque.homesislab.my.id/defaults/madinah.png',
        'https://mosque.homesislab.my.id/defaults/interior.png',
        'https://mosque.homesislab.my.id/defaults/quran.png',
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
        totalBalance: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        accounts: [
            { name: 'Kas Utama', balance: 0, income: 0, expense: 0 }
        ]
    },
    gallery: [
        'https://mosque.homesislab.my.id/defaults/makkah.png',
        'https://mosque.homesislab.my.id/defaults/madinah.png',
        'https://mosque.homesislab.my.id/defaults/interior.png',
        'https://mosque.homesislab.my.id/defaults/quran.png',
    ],
    version: 0,
};

async function validateAccess(request: Request, key: string) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('admin-session')?.value;

    if (!userId) return { allowed: false, status: 401 };

    const user = await findUserById(userId);
    if (!user || !user.mosqueKeys.includes(key)) {
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
            const baseConfig = JSON.parse(rows[0].config_json);
            return await hydrateConfigWithNormalizedData(key, baseConfig);
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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Strip normalized data before saving to JSON blob
        const jsonConfig = JSON.parse(JSON.stringify(config));
        if (jsonConfig.finance) jsonConfig.finance.accounts = [];
        jsonConfig.runningText = [];
        jsonConfig.sliderImages = [];
        jsonConfig.gallery = [];

        await connection.query(
            'INSERT INTO mosque_configs (mosque_key, config_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)',
            [key, JSON.stringify(jsonConfig)]
        );

        await persistNormalizedData(key, config, connection);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error(`Error saving config for ${key}:`, error);
        throw error;
    } finally {
        connection.release();
    }
}

const DEVICE_LOG_THROTTLE = 30 * 60 * 1000; // 30 minutes
const lastDeviceLog = new Map<string, number>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    const isClient = request.headers.get('x-clock-client') === 'true';
    if (isClient) {
        const deviceId = request.headers.get('x-device-id');
        if (!deviceId) {
            return NextResponse.json({ success: false, message: 'Device ID required' }, { status: 403, headers: corsHeaders });
        }

        // Log client connection (throttled)
        const now = Date.now();
        const lastLog = lastDeviceLog.get(deviceId) || 0;
        if (now - lastLog > DEVICE_LOG_THROTTLE) {
            lastDeviceLog.set(deviceId, now);
            logger.info(`Client Connected: ${deviceId}`, { key, deviceId });
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

async function handlePost(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default';

    const access = await validateAccess(request, key);
    if (!access.allowed) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status, headers: corsHeaders });
    }

    // Validate body is a proper JSON object
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
    }

    const validation = ConfigBodySchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json(
            { success: false, message: 'Invalid request body: must be a JSON object' },
            { status: 400, headers: corsHeaders }
        );
    }

    // Sanitize all string values to prevent XSS
    const sanitizedBody = sanitizeObject(body);

    const currentConfig = await getConfig(key);
    const newConfig = { ...currentConfig, ...sanitizedBody, version: Date.now() };
    await saveConfig(key, newConfig);

    // Broadcast change to all connected clients for this mosque
    broadcaster.broadcast(key, { type: 'CONFIG_UPDATED', newVersion: newConfig.version });

    logger.success(`Configuration updated for key: ${key}`, { key, updatedBy: access.userId });

    // Trigger WA init if enabled, or reset if disabled
    const wasEnabled = currentConfig.wabot?.enabled;
    const isEnabled = newConfig.wabot?.enabled;

    if (isEnabled && !wasEnabled) {
        waService.init(key).catch(err => console.error('[Config-API] WA Auto-init failed:', err));
    } else if (!isEnabled && wasEnabled) {
        console.log(`[Config-API] WA integration disabled for ${key}. Resetting session...`);
        waService.resetSession(key).catch(err => console.error('[Config-API] WA session reset failed:', err));
    }

    return NextResponse.json(newConfig, {
        headers: corsHeaders,
    });
}

export async function POST(request: NextRequest) {
    return withRateLimit('/api/config', request, () => handlePost(request));
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: corsHeaders,
    });
}

