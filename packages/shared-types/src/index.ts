export interface AudioTrack {
    id: string;
    title: string;
    url: string;
    duration?: number; // seconds
    fileName?: string;
}

export interface Playlist {
    id: string;
    name: string;
    tracks: AudioTrack[];
    shuffle: boolean;
}

export interface AudioSchedule {
    id: string;
    playlistId: string;
    type: 'prayer_relative' | 'manual_time';

    // For prayer_relative
    prayer?: 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya' | 'jumat';
    offsetMinutes?: number; // negative = before, positive = after
    trigger: 'adzan' | 'iqamah'; // Anchor point
    playMode?: 'before' | 'at' | 'after'; // Compatibility/Refinement

    // For manual_time
    time?: string; // "HH:mm"
    days?: number[]; // 0-6 (Sun-Sat)

    enabled: boolean;
}

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
        audioUrl?: string; // Legacy/Simple
    };
    adzan: {
        duration: number; // Duration in minutes (default 3-5)
        audioEnabled?: boolean;
        audioUrl?: string; // Optional specific Adzan audio
    };
    sholat: {
        duration: number; // Duration in minutes to show Sholat overlay
    };
    sliderImages: string[]; // List of image URLs
    runningText: string[]; // List of announcements

    // New Audio Architecture
    audio: {
        enabled: boolean; // Master switch

        // Storage
        playlists: Playlist[];
        schedules: AudioSchedule[];

        // Legacy / Simple Fallbacks (Optional, for backward compat or global override)
        globalUrl?: string;
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
        state: 'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'IMSAK' | 'NORMAL' | 'PLAYLIST';
        activePlaylistId?: string; // For PLAYLIST simulation
        startTime: number; // Timestamp of simulation start
    };
    advancedDisplay?: {
        showLogo: boolean;
        showDate: boolean;
        showClock: boolean;
        showRunningText: boolean;
        showPrayerTimes: boolean;
        theme: 'light' | 'dark' | 'glass';
        fontScale: 'small' | 'normal' | 'large';
        customCss?: string;
        headerOpacity?: number; // 0.1 to 1.0
        prayerTimesOpacity?: number; // 0.1 to 1.0

        // Custom Colors (Hex codes preferred)
        headerTextColor?: string;
        dateTextColor?: string;
        clockTextColor?: string;
        runningTextColor?: string;
        runningTextBgColor?: string;
        prayerTimesTextColor?: string;
        prayerTimesBgColor?: string;
        prayerTimesActiveColor?: string;
    };
    wabot?: {
        enabled: boolean;
        apiUrl: string;
        authToken?: string;
        targetNumber: string; // Group or specific number
        messageTemplate?: string;
        imsakMessageTemplate?: string;
        // Auth
        username?: string;
        password?: string;
        sessionId?: string; // Selected session ID
        // AI
        aiEnabled?: boolean;
        aiPrompt?: string;
        imsakAiEnabled?: boolean;
        imsakAiPrompt?: string;
    };
}

export interface LogEntry {
    id: string;
    timestamp: string; // ISO String
    level: 'info' | 'warn' | 'error' | 'success';
    source: 'client' | 'admin' | 'system';
    message: string;
    metadata?: Record<string, any>;
}

