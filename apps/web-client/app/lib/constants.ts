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

export const API_URL = 'http://localhost:3001/api/config'; // Admin URL

export async function fetchConfig(): Promise<MosqueConfig> {
    try {
        const res = await fetch(API_URL, {
            cache: 'no-store', // Disable caching for real-time updates
            mode: 'cors'
        });
        if (!res.ok) throw new Error('Failed to fetch config');
        return await res.json();
    } catch (error) {
        console.error('Error fetching config, using default:', error);
        return DEFAULT_CONFIG;
    }
}

export function resolveUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const origin = API_URL.replace('/api/config', '');
    return `${origin}${url}`;
}
