import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export const DEFAULT_CONFIG: MosqueConfig = {
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
            lat: -6.2088, // Jakarta
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
        displayDuration: 10, // Default 10 minutes wait
    },
    sliderImages: [
        'https://images.unsplash.com/photo-1542204625-ca960ca44635?q=80&w=2670', // Mosque interior
        'https://images.unsplash.com/photo-1596492789643-2cb06f50c766?q=80&w=2669', // Quran
    ],
    runningText: [
        'Mohon luruskan dan rapatkan shaf.',
        'Matikan alat komunikasi saat berada di dalam masjid.',
        'Kajian rutin ba\'da Maghrib: Tafsir Jalalain bersama Ustadz fulan.'
    ],
    audio: {
        enabled: true,
        // Example URL: Murottal 30 Juz
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        playBeforeMinutes: 10,
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
            { name: 'Kas Masjid', balance: 10000000, income: 1500000, expense: 500000 },
            { name: 'Kas Anak Yatim', balance: 3000000, income: 500000, expense: 200000 },
            { name: 'Pembangunan', balance: 2000000, income: 500000, expense: 300000 },
        ]
    },
    gallery: []
};

export function getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
        let storedUrl = localStorage.getItem('serverUrl');
        if (storedUrl && storedUrl.includes('localhost')) {
            storedUrl = storedUrl.replace('localhost', '127.0.0.1');
            localStorage.setItem('serverUrl', storedUrl);
        }
        if (storedUrl) return storedUrl;
    }
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultUrl = 'http://127.0.0.1:3001';
    return envUrl || defaultUrl;
}

export async function fetchConfig(): Promise<MosqueConfig> {
    const key = typeof window !== 'undefined' ? localStorage.getItem('mosqueKey') : null;
    try {
        if (!key) return DEFAULT_CONFIG;

        const baseUrl = getApiBaseUrl();
        const apiConfigUrl = `${baseUrl}/api/config?key=${key}`;

        // Device Identification
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = `clock-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceId', deviceId);
        }

        const res = await fetch(apiConfigUrl, {
            cache: 'no-store',
            mode: 'cors',
            headers: {
                'x-clock-client': 'true',
                'x-device-id': deviceId
            }
        });

        if (res.status === 401 || res.status === 403) {
            console.error('Device not authorized or key invalid');
            return null as any; // Return null to trigger logout
        }

        if (!res.ok) throw new Error('Failed to fetch config');

        const config = await res.json();

        // Background registration/heartbeat
        fetch(`${baseUrl}/api/devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-clock-client': 'true',
                'x-device-id': deviceId
            },
            body: JSON.stringify({
                deviceId,
                mosqueKey: key,
                deviceName: `TV Clock - ${config.mosqueInfo.name}`
            })
        }).then(r => {
            if (!r.ok) console.warn('Heartbeat registration failed:', r.status);
        }).catch((err) => {
            console.warn('Heartbeat network error:', err);
        });

        if (config) return config;
        return config;
    } catch (error: any) {
        // DETECT NETWORK ERROR (CORS, DNS, SERVER DOWN)
        const msg = error?.message || String(error);
        const isNetworkError = msg.toLowerCase().includes('fetch') ||
            error?.name === 'TypeError' ||
            msg.includes('network');

        if (isNetworkError) {
            // SILENTLY HANDLE NETWORK FAILURES
            // Logging with console.error here can trigger the Next.js dev overlay crash
            console.warn('Network unreachable, keeping last state');
            return 'OFFLINE' as any;
        }

        // Only log serious logic errors
        console.error('Logic error in fetchConfig:', error);

        if (key) return DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
    }
}

export function resolveUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const key = typeof window !== 'undefined' ? localStorage.getItem('mosqueKey') : 'default';
    const origin = getApiBaseUrl();

    let resolvedPath = url;

    if (url.startsWith('/uploads/') && !url.startsWith(`/uploads/${key}/`)) {
        resolvedPath = url.replace('/uploads/', `/uploads/${key}/`);
    }

    return `${origin}${resolvedPath}`;
}
