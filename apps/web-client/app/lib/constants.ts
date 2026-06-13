import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export const DEFAULT_CONFIG: MosqueConfig = {
    mosqueInfo: {
        name: 'Mosque',
        address: '',
    },
    display: {
        theme: 'dark',
        showSeconds: true,
        showHijriDate: true,
        timeOffset: 0, // in seconds
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
        displayDuration: 10, // Default 10 minutes wait
    },
    adzan: {
        duration: 4, // Default 4 minutes for Adzan
    },
    sholat: {
        duration: 10, // Default 10 minutes for Sholat
    },
    sliderImages: [
        'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?q=80&w=2670',
        'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=2670',
        'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=2670',
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2670',
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
            { name: 'Kas Masjid', balance: 10000000, income: 1500000, expense: 500000 },
            { name: 'Kas Anak Yatim', balance: 3000000, income: 500000, expense: 200000 },
            { name: 'Pembangunan', balance: 2000000, income: 500000, expense: 300000 },
        ]
    },
    gallery: [],
    wabot: {
        enabled: false,
        targetNumber: 'status@broadcast',
        messageTemplate: 'Waktu sholat {sholat} telah tiba. Segera tunaikan sholat.',
    },
    version: 0,
};

export function getApiBaseUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultUrl = 'https://mosque.homesislab.my.id';
    return envUrl || defaultUrl;
}

/** Sleep helper for retry delays */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with exponential backoff retry.
 * Retries up to `maxRetries` times with doubling delay on network errors.
 * Non-network errors are re-thrown immediately without retry.
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetch(url, options);
        } catch (error: any) {
            lastError = error;
            const isNetworkError = error?.name === 'TypeError' ||
                (error?.message || '').toLowerCase().includes('fetch') ||
                (error?.message || '').includes('network');

            if (!isNetworkError) throw error; // Re-throw non-network errors immediately

            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // 1s → 2s → 4s
                console.warn(`[fetchConfig] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    throw lastError;
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

        const fetchOptions: RequestInit = {
            cache: 'no-store',
            mode: 'cors',
            headers: {
                'x-clock-client': 'true',
                'x-device-id': deviceId
            }
        };

        // Use retry logic for resilience against temporary network hiccups
        const res = await fetchWithRetry(apiConfigUrl, fetchOptions, 3);

        if (res.status === 401 || res.status === 403) {
            try {
                const errData = await res.json();
                if (errData.message === 'Device blocked' || errData.message === 'Device ID required' || errData.message === 'Unauthorized') {
                    console.error('Explicit logout signal:', errData.message);
                    return null as any; // Only logout if explicit
                }
            } catch (e) {
                // If response is not JSON (e.g. HTML 403), treat as network/server error
                console.warn('Non-JSON 403 response, treating as temporary failure');
                return 'OFFLINE' as any;
            }
        }

        if (!res.ok) throw new Error('Failed to fetch config');

        const config = await res.json();

        // ── Version-based audio cache invalidation ─────────────────────────
        // When config.version changes (admin saved new changes), clear audio-cache
        // so updated/new audio files are re-fetched from server.
        if (typeof config.version === 'number') {
            const cachedVersion = localStorage.getItem('configVersion');
            const newVersion = String(config.version);
            if (cachedVersion !== null && cachedVersion !== newVersion) {
                // Config changed — purge stale audio cache
                if ('caches' in window) {
                    caches.delete('audio-cache').then(() => {
                        console.info(`[Cache] Config v${cachedVersion}→v${newVersion}: audio-cache cleared`);
                    }).catch(() => {});
                }
            }
            localStorage.setItem('configVersion', newVersion);
        }
        // ───────────────────────────────────────────────────────────────────

        // Background registration/heartbeat (fire and forget)
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

        return config;
    } catch (error: any) {
        // DETECT NETWORK ERROR (CORS, DNS, SERVER DOWN) - after all retries exhausted
        const msg = error?.message || String(error);
        const isNetworkError = msg.toLowerCase().includes('fetch') ||
            error?.name === 'TypeError' ||
            msg.includes('network');

        if (isNetworkError) {
            // SILENTLY HANDLE NETWORK FAILURES after retries
            console.warn('[fetchConfig] Network unreachable after retries, keeping last state');
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
