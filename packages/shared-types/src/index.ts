export interface MosqueConfig {
    mosqueInfo: {
        name: string;
        address: string;
        logoUrl?: string;
    };
    display: {
        theme: 'dark' | 'light' | 'green' | 'blue';
        showSeconds: boolean;
        showHijriDate: boolean;
    };
    prayerTimes: {
        calculationMethod: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        adjustments: {
            subuh: number;
            dzuhur: number;
            ashar: number;
            maghrib: number;
            isya: number;
        };
    };
    iqamah: {
        enabled: boolean;
        waitTime: {
            subuh: number;
            dzuhur: number;
            ashar: number;
            maghrib: number;
            isya: number;
        };
        displayDuration: number; // Duration to show countdown (e.g., 10 minutes)
        audioEnabled?: boolean;
        audioUrl?: string;
    };
    sliderImages: string[]; // List of image URLs
    runningText: string[]; // List of announcements
    audio: {
        enabled: boolean;
        url: string; // Default Stream/MP3 URL
        playBeforeMinutes: number; // Default Play X minutes before prayer
        customSchedule?: {
            [key in 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya' | 'jumat']: {
                url: string;
                playMode: 'before' | 'at' | 'after';
                offsetMinutes: number;
                enabled: boolean;
            }
        };
    };
    officers: {
        role: string;
        name: string;
    }[];
    finance: {
        totalBalance: number;
        lastUpdated: string; // Date string
        accounts: {
            name: string;
            balance: number;
            income: number;
            expense: number;
        }[];
    };
    gallery: string[]; // List of all uploaded file URLs
    kajian?: {
        enabled: boolean;
        schedule: {
            day: string;
            time: string;
            title: string;
            speaker: string;
        }[];
    };
    jumat?: {
        date?: string; // YYYY-MM-DD
        khotib: string;
        imam: string;
        muadzin: string;
    }[];
    ramadhan?: {
        enabled: boolean;
        imsakOffset: number; // minutes before subuh
        imsakAudioEnabled?: boolean;
        imsakAudioUrl?: string;
        imsakAudioDuration?: number; // duration in minutes before imsak
    };
    audioTest?: {
        url: string;
        playedAt: number;
    };
    simulation?: {
        isSimulating: boolean;
        prayerName: string; // 'Subuh', 'Dzuhur', etc.
        state: 'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'IMSAK' | 'NORMAL';
        startTime: number; // Timestamp of simulation start
    };
}
