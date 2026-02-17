import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export type AppState = 'NORMAL' | 'ADZAN' | 'IQAMAH' | 'SHOLAT' | 'IMSAK' | 'PLAYLIST';

export interface NextEvent {
    state: AppState;
    nextPrayerName: string;
    secondsRemaining: number;
    activeAudioUrl: string;
    activePlaylistId?: string;
    shouldPlayAudio: boolean;
    eventTime?: Date;
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
    let activePlaylistId = '';
    let shouldPlayAudio = false;
    let eventTime: Date | undefined = undefined;

    // --- Simulation Override ---
    if (config.simulation?.isSimulating) {
        const sim = config.simulation as any;
        const simState = sim.state || 'NORMAL';
        const simPrayerName = sim.prayerName || '';
        const simStartTime = sim.startTime || Date.now();

        // --- Simulation: Populate Audio URL if applicable ---
        if (simState === 'ADZAN' && config.adzan?.audioEnabled && config.adzan.audioUrl) {
            activeAudioUrl = config.adzan.audioUrl;
            shouldPlayAudio = true;
        } else if (simState === 'IQAMAH' && config.iqamah?.audioEnabled && config.iqamah.audioUrl) {
            activeAudioUrl = config.iqamah.audioUrl;
            shouldPlayAudio = true;
        } else if (simState === 'PLAYLIST' && sim.activePlaylistId) {
            activePlaylistId = sim.activePlaylistId;
            shouldPlayAudio = true;
        } else if (simState === 'IMSAK' && config.ramadhan?.enabled && config.ramadhan.imsakAudioEnabled && config.ramadhan.imsakAudioUrl) {
            activeAudioUrl = config.ramadhan.imsakAudioUrl;
            shouldPlayAudio = true;
        }

        return {
            state: simState as AppState,
            nextPrayerName: simPrayerName,
            secondsRemaining: Math.floor((Date.now() - simStartTime) / 1000),
            activeAudioUrl,
            activePlaylistId,
            shouldPlayAudio,
            eventTime: new Date(simStartTime)
        };
    }

    if (!prayerTimes) return { state, nextPrayerName, secondsRemaining, activeAudioUrl, activePlaylistId, shouldPlayAudio };

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
                eventTime = imsakTime;
                break;
            }
        }

        // If timeDiff is positive, means we passed the prayer time
        if (timeDiff >= 0) {
            // Durations
            const adzanDuration = config.adzan?.duration || 4; // Default 4 mins
            const iqamahWaitTime = config.iqamah?.waitTime?.[prayer] || 10;
            const sholatDuration = config.sholat?.duration || 10; // Default 10 mins

            // Timelines
            const adzanEndTime = new Date(pTime.getTime() + adzanDuration * 60000);
            const iqamahStartTime = adzanEndTime; // Iqamah starts after Adzan
            const iqamahEndTime = new Date(iqamahStartTime.getTime() + iqamahWaitTime * 60000);
            const sholatEndTime = new Date(iqamahEndTime.getTime() + sholatDuration * 60000);

            // 1. ADZAN PHASE
            if (now < adzanEndTime) {
                state = 'ADZAN';
                secondsRemaining = Math.floor((adzanEndTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = prayer;
                eventTime = pTime;
                break;
            }

            // 2. IQAMAH PHASE
            if (now < iqamahEndTime) {
                state = 'IQAMAH';
                // Seconds remaining until Iqamah ends (Sholat starts)
                secondsRemaining = Math.floor((iqamahEndTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = prayer;
                break;
            }

            // 3. SHOLAT PHASE
            if (now < sholatEndTime) {
                state = 'SHOLAT';
                secondsRemaining = Math.floor((sholatEndTime.getTime() - now.getTime()) / 1000);
                nextPrayerName = prayer;
                break;
            }
        }
    }

    // --- 3. Audio Trigger Logic ---

    // Check for Imsak Audio (Ramadhan Mode)
    if (!shouldPlayAudio && state === 'IMSAK' && config.ramadhan?.enabled && config.ramadhan.imsakAudioEnabled && config.ramadhan.imsakAudioUrl) {
        shouldPlayAudio = true;
        activeAudioUrl = config.ramadhan.imsakAudioUrl;
    }

    // Evaluate Schedules
    if (config.audio?.schedules && config.audio.schedules.length > 0) {
        for (const schedule of config.audio.schedules) {
            if (!schedule.enabled) continue;

            if (schedule.type === 'prayer_relative' && schedule.prayer) {
                // Check if this schedule matches the "upcoming" prayer OR the "just passed" prayer (for 'after' mode)
                // Simple approach: Check against ALL prayers for the day

                let pTime = new Date(prayerTimes[schedule.prayer]);
                pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

                // Adjust for trigger (Adzan vs Iqamah)
                let triggerTime = pTime.getTime();
                if (schedule.trigger === 'iqamah') {
                    const adzanDur = config.adzan?.duration || 4;
                    triggerTime += adzanDur * 60000;
                }

                const offset = (schedule.offsetMinutes || 0) * 60000;
                let startTime = 0;
                let endTime = 0;

                // Heuristic for duration based on offset sign or explicit mode
                // If offset is negative (e.g. -10), usually means "Start 10 mins before trigger and end at trigger"
                // If offset is positive (e.g. +5), usually means "Start 5 mins after trigger" -> needs a duration.

                if (offset < 0) {
                    // "Before" mode: Play from [Trigger - |Offset|] to [Trigger]
                    startTime = triggerTime + offset; // offset is negative
                    endTime = triggerTime;
                } else {
                    // "After" mode or "At" mode
                    // Default duration 15 mins if not specified (maybe add duration to schedule later)
                    startTime = triggerTime + offset;
                    endTime = startTime + 15 * 60000;
                }

                if (now.getTime() >= startTime && now.getTime() < endTime) {
                    shouldPlayAudio = true;
                    activePlaylistId = schedule.playlistId;
                    // specific schedule wins
                    break;
                }
            }
        }
    }

    // Fallback: Legacy Global URL if no playlist is active
    if (!shouldPlayAudio && config.audio?.enabled && config.audio.globalUrl && !activePlaylistId) {
        // Legacy logic: playBeforeMinutes before EVERY prayer
        // We can keep this for backward compatibility or users who don't set up advanced schedules
        const playBefore = (config.audio as any).playBeforeMinutes || 10;
        for (const prayer of prayers) {
            const pTime = new Date(prayerTimes[prayer]);
            pTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

            const start = pTime.getTime() - (playBefore * 60000);
            const end = pTime.getTime();

            if (now.getTime() >= start && now.getTime() < end) {
                shouldPlayAudio = true;
                activeAudioUrl = config.audio.globalUrl;
                break;
            }
        }
    }

    // Iqamah Beep/Audio (Legacy/Specific)
    if (!shouldPlayAudio && state === 'IQAMAH' && config.iqamah.audioEnabled && config.iqamah.audioUrl) {
        if (secondsRemaining <= 30) {
            shouldPlayAudio = true;
            activeAudioUrl = config.iqamah.audioUrl;
        }
    }

    return { state, nextPrayerName, secondsRemaining, activeAudioUrl, activePlaylistId, shouldPlayAudio, eventTime };
}

