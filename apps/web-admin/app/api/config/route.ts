import { NextResponse } from 'next/server';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
        url: 'https://archive.org/download/MurottalMisyariRasyidAlAfasy/001%20Al%20Fatihah.mp3',
        playBeforeMinutes: 10,
    },
    officers: [
        { role: "Khatib", name: "Ust. Fulan" },
        { role: "Imam", name: "Ust. Fulan" },
        { role: "Muadzin", name: "Sdr. Ahmad" },
        { role: "Bilal", name: "Sdr. Budi" }
    ],
    finance: {
        balance: 15000000,
        income: 2500000,
        expense: 1000000,
        lastUpdated: new Date().toISOString().split('T')[0]
    },
    gallery: []
};

const DATA_DIR = join(process.cwd(), 'data');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

async function getConfig(): Promise<MosqueConfig> {
    try {
        const data = await readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, ensure dir exists and write default
        try {
            await mkdir(DATA_DIR, { recursive: true });
            await writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        } catch (writeError) {
            console.error('Error initializing config:', writeError);
            return defaultConfig;
        }
    }
}

async function saveConfig(config: MosqueConfig) {
    try {
        await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

export async function GET() {
    const config = await getConfig();
    return NextResponse.json(config, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(request: Request) {
    const body = await request.json();
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...body };
    await saveConfig(newConfig);

    return NextResponse.json(newConfig, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
