import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export type AppState = 'NORMAL' | 'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'IMSAK';

export interface NextEvent {
    state: AppState;
    nextPrayerName: string;
    secondsRemaining: number;
    activeAudioUrl: string;
    shouldPlayAudio: boolean;
}

export function calculateAppState(
    config: MosqueConfig,
    prayerTimes: any, // Result from getPrayerTimes
    now: Date
): NextEvent {
    let state: AppState = 'NORMAL';
    let nextPrayerName = '';
    let secondsRemaining = 0;
    let activeAudioUrl = '';
    let shouldPlayAudio = false;

    // --- Simulation Override ---
    if (config.simulation?.isSimulating) {
        return {
            state: config.simulation.state,
            nextPrayerName: config.simulation.prayerName,
            secondsRemaining: Math.floor((Date.now() - config.simulation.startTime) / 1000), // Incremental counter
            activeAudioUrl: '', // Simulation doesn't force audio URL yet, unless specifically handled
            shouldPlayAudio: false
        };
    }

    if (!prayerTimes) return { state, nextPrayerName, secondsRemaining, activeAudioUrl, shouldPlayAudio };

    const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;

    // --- 1. Find Next Prayer and Current Phase (NORMAL/IQAMAH/SHOLAT) ---
    // First, find the very next prayer (even if it's tomorrow)
    let nextP = '';
    let minDiff = Infinity;

    for (const prayer of prayers) {
        let pTime = new Date(prayerTimes[prayer]);
        pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        let diff = pTime.getTime() - now.getTime();
        if (diff < 0) {
            // Already passed today, try tomorrow
            pTime.setDate(pTime.getDate() + 1);
            diff = pTime.getTime() - now.getTime();
        }

        if (diff < minDiff) {
            minDiff = diff;
            nextP = prayer;
        }
    }
    nextPrayerName = nextP;
    secondsRemaining = Math.floor(minDiff / 1000);

    // --- 2. Check for "Active" phases (IMSAK/IQAMAH/SHOLAT) ---
    for (const prayer of prayers) {
        const pTime = new Date(prayerTimes[prayer]);
        pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        const timeDiff = now.getTime() - pTime.getTime();

        // Check for Imsak (Only for Subuh in Ramadhan Mode)
        if (prayer === 'subuh' && config.ramadhan?.enabled) {
            const imsakOffset = config.ramadhan.imsakOffset || 10;
            const imsakTime = new Date(pTime.getTime() - imsakOffset * 60000);

            if (now >= imsakTime && now < pTime) {
                state = 'IMSAK';
                secondsRemaining = Math.floor((pTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = 'Subuh';
                break;
            }
        }

        // If timeDiff is positive, means we passed the prayer time
        if (timeDiff >= 0) {
            const waitTimeMinutes = config.iqamah.waitTime[prayer] || 10;
            const iqamahTime = new Date(pTime.getTime() + waitTimeMinutes * 60000);
            const sholatDuration = 10; // Minutes to blank screen
            const sholatEndTime = new Date(iqamahTime.getTime() + sholatDuration * 60000);

            if (now < iqamahTime) {
                state = 'IQAMAH';
                secondsRemaining = Math.floor((iqamahTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = prayer;
                break; // Found active phase
            }

            if (now < sholatEndTime) {
                state = 'SHOLAT';
                secondsRemaining = Math.floor((sholatEndTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = prayer;
                break; // Found active phase
            }
        }
    }

    // --- 3. Audio Trigger Logic ---
    const isFriday = now.getDay() === 5;

    // Check for Imsak Audio (Ramadhan Mode)
    if (!shouldPlayAudio && config.ramadhan?.enabled && config.ramadhan?.imsakAudioEnabled && config.ramadhan?.imsakAudioUrl) {
        const subuhTime = new Date(prayerTimes.subuh);
        subuhTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

        const imsakOffset = config.ramadhan.imsakOffset || 10;
        const imsakTime = new Date(subuhTime.getTime() - imsakOffset * 60000);

        const imsakAudioDuration = config.ramadhan.imsakAudioDuration || 30;
        const imsakAudioStartTime = new Date(imsakTime.getTime() - imsakAudioDuration * 60000);

        if (now.getTime() >= imsakAudioStartTime.getTime() && now.getTime() < imsakTime.getTime()) {
            shouldPlayAudio = true;
            activeAudioUrl = config.ramadhan.imsakAudioUrl;
        }
    }

    // Check custom schedules first
    for (const prayer of prayers) {
        // For Dzuhur on Fridays, we use "jumat" schedule if it exists and is enabled
        const scheduleKey = (isFriday && prayer === 'dzuhur' && config.audio?.customSchedule?.jumat?.enabled)
            ? 'jumat'
            : prayer;

        const custom = config.audio?.customSchedule?.[scheduleKey];
        if (custom?.enabled) {
            const pTime = new Date(prayerTimes[prayer]);
            pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

            let startTime = 0;
            let endTime = 0;

            if (custom.playMode === 'before') {
                startTime = pTime.getTime() - (custom.offsetMinutes * 60000);
                endTime = pTime.getTime();
            } else if (custom.playMode === 'at') {
                startTime = pTime.getTime();
                endTime = pTime.getTime() + (custom.offsetMinutes || 5) * 60000;
            } else if (custom.playMode === 'after') {
                startTime = pTime.getTime() + (custom.offsetMinutes * 60000);
                endTime = startTime + 5 * 60000; // Default 5 mins for after
            }

            if (now.getTime() >= startTime && now.getTime() < endTime) {
                shouldPlayAudio = true;
                activeAudioUrl = custom.url;
                break;
            }
        }
    }

    // Fallback to global audio if enabled and no custom audio is active
    if (!shouldPlayAudio && config.audio?.enabled && config.audio.url) {
        for (const prayer of prayers) {
            const pTime = new Date(prayerTimes[prayer]);
            pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

            const startTime = pTime.getTime() - (config.audio.playBeforeMinutes * 60000);
            const endTime = pTime.getTime();

            if (now.getTime() >= startTime && now.getTime() < endTime) {
                shouldPlayAudio = true;
                activeAudioUrl = config.audio.url;
                break;
            }
        }
    }

    // Check for Iqamah Audio (Alert at the end of countdown)
    if (!shouldPlayAudio && state === 'IQAMAH' && config.iqamah.audioEnabled && config.iqamah.audioUrl) {
        // Play if we are in the last 30 seconds of the countdown
        if (secondsRemaining <= 30) {
            shouldPlayAudio = true;
            activeAudioUrl = config.iqamah.audioUrl;
        }
    }

    return { state, nextPrayerName, secondsRemaining, activeAudioUrl, shouldPlayAudio };
}
