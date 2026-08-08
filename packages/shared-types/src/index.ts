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
    targetDevices?: string[];
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
    durationMinutes?: number;
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
        timeOffset?: number; // in seconds
    };
    // Modern Theme Configuration
    theme?: {
        mode: 'light' | 'dark' | 'custom';
        backgroundType: 'solid' | 'image' | 'video';
        backgroundColor?: string;
        backgroundImageUrl?: string;
        primaryColor?: string;
        accentColor?: string;
    };
    prayerTimes: {
        calculationMethod: string;
        /** myQuran (Kemenag) city id untuk jadwal solat harian dari pusat waktu shalat. */
        cityId?: string;
        /** Nama kota (informasi tampilan saja). */
        cityName?: string;
        coordinates: {
            lat: number;
            lng: number;
        };
        adjustments: {
            subuh: number;
            dzuhur: number;
            jumat: number;
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
            jumat: number;
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
        playbackState?: 'playing' | 'paused' | 'stopped'; // Remote Control

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
    officersEnabled?: boolean;
    finance: {
        enabled?: boolean;
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
    jumatEnabled?: boolean;
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
        headerBlur?: number; // Blur in px
        prayerTimesBlur?: number; // Blur in px
        runningTextSpeed?: number; // Velocity or duration factor
        clockWeight?: 'light' | 'normal' | 'bold';
        showNextPrayerCountdown?: boolean;
        lowEndMode?: boolean; // Mode Hemat: matikan blur & animasi berat untuk perangkat spesifikasi rendah (mis. AMD E2 / Intel Atom)

        // Custom Colors (Hex codes preferred)
        headerTextColor?: string;
        dateTextColor?: string;
        clockTextColor?: string;
        glowColor?: string; // For clock
        runningTextColor?: string;
        runningTextBgColor?: string;
        prayerTimesTextColor?: string;
        prayerTimesBgColor?: string;
        prayerTimesActiveColor?: string;
        prayerTimesActiveBgColor?: string;
        prayerTimesActiveTextColor?: string;
        slideshowOverlayColor?: string;
    };
    wabot?: {
        enabled: boolean;
        apiUrl?: string;
        authToken?: string;
        sessionId?: string;
        targetNumber: string; // Group or specific number
        messageTemplate?: string;
        imsakMessageTemplate?: string;
        aiEnabled?: boolean;
        aiPrompt?: string;
        imsakAiEnabled?: boolean;
        imsakAiPrompt?: string;
        prayerNotifications?: {
            [key: string]: {
                enabled: boolean;
                template?: string;
                /** Kirim pesan reminder X menit sebelum waktu adzan */
                reminderEnabled?: boolean;
                /** Berapa menit sebelum adzan reminder dikirim (default: 10) */
                reminderMinutes?: number;
                /** Template pesan reminder. Variabel: {sholat}, {jam}, {menit} */
                reminderTemplate?: string;
            }
        };
    };
    videoStreaming?: {
        enabled: boolean;
        url: string; // YouTube embed URL
        showInSlideshow: boolean; // Include in rotation
        durationMinutes: number; // Duration specific to this stream slide
        muted?: boolean;
        paused?: boolean;
    };
    version: number; // For SSE and sync tracking
}

export type SyncEvent = 
    | { type: 'CONFIG_UPDATED'; newVersion: number }
    | { type: 'HEARTBEAT' };

export interface LogEntry {
    id: string;
    timestamp: string; // ISO String
    level: 'info' | 'warn' | 'error' | 'success';
    source: 'client' | 'admin' | 'system';
    message: string;
    metadata?: Record<string, any>;
}

export interface AudioActiveStatus {
    isPlaying: boolean;
    title?: string;
    playlistId?: string;
    trackId?: string;
    currentTime: number;
    duration: number;
    updatedAt: number; // timestamp
}

export interface AudioSyncStatus {
    deviceId: string;
    /** List of audio file URLs that are currently cached/downloaded on the device */
    cachedFiles: string[];
    /** Total number of files cached */
    totalCached: number;
    /** Last sync timestamp (ms) */
    updatedAt: number;
    /** Optional: current playlist the device has synced */
    playlistId?: string;
    /** Optional: error message if sync failed */
    error?: string;
}

// Export validation schemas and utilities
export {
    // Auth validators
    LoginSchema,
    RegisterSchema,
    PasswordResetSchema,
    // Config validators
    MosqueConfigSchema,
    UpdateConfigSchema,
    // File upload validators
    FileUploadSchema,
    // Prayer times validators
    PrayerTimesConfigSchema,
    // Utility functions
    validateData,
    formatZodErrors,
    // Types
    type LoginInput,
    type RegisterInput,
    type PasswordResetInput,
    type MosqueConfigInput,
    type UpdateConfigInput,
    type FileUploadInput,
    type PrayerTimesConfigInput,
} from './validators';
