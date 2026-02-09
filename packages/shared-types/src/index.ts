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
    };
    sliderImages: string[]; // List of image URLs
    runningText: string[]; // List of announcements
    audio: {
        enabled: boolean;
        url: string; // Stream/MP3 URL
        playBeforeMinutes: number; // Play X minutes before prayer
    };
    officers: {
        role: string;
        name: string;
    }[];
    finance: {
        balance: number;
        income: number;
        expense: number;
        lastUpdated: string; // Date string
    };
    gallery: string[]; // List of all uploaded file URLs
}
