import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export type AppState = 'NORMAL' | 'ADZAN' | 'IQAMAH' | 'SHOLAT';

export interface NextEvent {
    state: AppState;
    nextPrayerName: string;
    secondsRemaining: number;
}

export function calculateAppState(
    config: MosqueConfig,
    prayerTimes: any, // Result from getPrayerTimes
    now: Date
): NextEvent {
    if (!prayerTimes) return { state: 'NORMAL', nextPrayerName: '', secondsRemaining: 0 };

    const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

    // Find current active prayer window
    for (const prayer of prayers) {
        const pTime = new Date(prayerTimes[prayer]);
        // Ensure pTime has same date as 'now' for correct comparison
        pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        // Check if we are in "After Prayer entered" zone
        const timeDiff = now.getTime() - pTime.getTime();

        // If timeDiff is positive, means we passed the prayer time
        if (timeDiff >= 0) {
            const waitTimeMinutes = config.iqamah.waitTime[prayer as keyof typeof config.iqamah.waitTime] || 10;
            const iqamahTime = new Date(pTime.getTime() + waitTimeMinutes * 60000);
            const sholatDuration = 10; // Minutes to blank screen
            const sholatEndTime = new Date(iqamahTime.getTime() + sholatDuration * 60000);

            // 1. ADZAN Phase (First 2 minutes of prayer time) - Optional, can just be IQAMAH countdown directly
            // Let's make it simple: From PrayerTime until IqamahTime is "WAITING IQAMAH"

            if (now < iqamahTime) {
                // We are in waiting period
                return {
                    state: 'IQAMAH',
                    nextPrayerName: prayer,
                    secondsRemaining: Math.floor((iqamahTime.getTime() - now.getTime()) / 1000),
                };
            }

            if (now < sholatEndTime) {
                // We are in Sholat period
                return {
                    state: 'SHOLAT',
                    nextPrayerName: prayer,
                    secondsRemaining: Math.floor((sholatEndTime.getTime() - now.getTime()) / 1000),
                };
            }
        }
    }

    return { state: 'NORMAL', nextPrayerName: '', secondsRemaining: 0 };
}
