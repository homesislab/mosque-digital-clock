import { getPrayerTimes, formatTime } from './prayer-times';
import pool from './db';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { logger } from '../app/lib/logger-server';

// In-memory lock to prevent duplicate sends within the same minute
// Key: mosqueKey_prayerName_day_hour_minute
const sentNotifications = new Set<string>();

// Cleanup old keys every hour
setInterval(() => {
    sentNotifications.clear();
}, 60 * 60 * 1000);

export async function checkAndSendNotifications() {
    try {
        console.log('[Worker] Checking prayer times...');

        // 1. Get ALL configs
        const [rows]: any = await pool.query('SELECT mosque_key, config_json FROM mosque_configs');

        if (!rows || rows.length === 0) return;

        let now = new Date();

        for (const row of rows) {
            const key = row.mosque_key;
            let config: MosqueConfig;

            try {
                config = JSON.parse(row.config_json);
            } catch (e) {
                console.error(`[Worker] Failed to parse config for ${key}`, e);
                continue;
            }

            // Apply global time offset per mosque
            let correctedNow = now;
            if (config.display?.timeOffset) {
                correctedNow = new Date(now.getTime() + config.display.timeOffset * 1000);
            }

            const currentHour = correctedNow.getHours();
            const currentMinute = correctedNow.getMinutes();

            if (!config.wabot?.enabled) continue;

            const prayers = getPrayerTimes(config, correctedNow);
            if (!prayers) continue;

            // Check each prayer time
            for (const [name, time] of Object.entries(prayers)) {
                // We only care about Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya
                // Normalized names for display/sending
                const displayNames: Record<string, string> = {
                    imsak: 'Imsak',
                    subuh: 'Subuh',
                    dzuhur: 'Dzuhur',
                    jumat: 'Jumat',
                    ashar: 'Ashar',
                    maghrib: 'Maghrib',
                    isya: 'Isya'
                };

                const displayName = displayNames[name];
                if (!displayName) continue; // Skip Syuruq or others if not needed

                if (!(time instanceof Date)) continue;

                const prayerKey = name.toLowerCase();

                // ── 1. ADZAN TIME: Exact match ─────────────────────────────────
                if (time.getHours() === currentHour && time.getMinutes() === currentMinute) {

                    // Deduplication Key
                    const lockKey = `${key}_${name}_${now.getDate()}_${currentHour}_${currentMinute}`;

                    if (!sentNotifications.has(lockKey)) {
                        // Check per-prayer notification setting
                        const pConfig = config.wabot?.prayerNotifications?.[prayerKey];
                        const isEnabled = pConfig ? pConfig.enabled : true;

                        if (!isEnabled) {
                            console.log(`[Worker] Skipping ${displayName} for ${key} (disabled in config)`);
                        } else {
                            console.log(`[Worker] Triggering ${displayName} for ${key} at ${formatTime(time)}`);
                            sentNotifications.add(lockKey);
                            await triggerWabot(key, config, displayName, time);
                        }
                    }
                }

                // ── 2. REMINDER: X minutes before adzan ───────────────────────
                const pConfig = config.wabot?.prayerNotifications?.[prayerKey];
                if (pConfig?.reminderEnabled) {
                    const reminderMinutes = pConfig.reminderMinutes ?? 10;
                    // Calculate when reminder should fire
                    const reminderTime = new Date(time.getTime() - reminderMinutes * 60 * 1000);

                    if (reminderTime.getHours() === currentHour && reminderTime.getMinutes() === currentMinute) {
                        const reminderLockKey = `${key}_${name}_reminder${reminderMinutes}_${now.getDate()}_${currentHour}_${currentMinute}`;

                        if (!sentNotifications.has(reminderLockKey)) {
                            console.log(`[Worker] Sending ${reminderMinutes}-min reminder for ${displayName} to ${key}`);
                            sentNotifications.add(reminderLockKey);
                            await triggerReminderWabot(key, config, displayName, time, reminderMinutes);
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('[Worker] Error in check loop:', error);
    }
}


async function triggerWabot(mosqueKey: string, config: MosqueConfig, prayerName: string, prayerTime: Date) {
    try {
        const timeStr = formatTime(prayerTime);
        const isImsak = prayerName.toLowerCase() === 'imsak';

        // Choose Template
        let template = config.wabot?.messageTemplate || "Waktu sholat {sholat} telah tiba.";

        // NEW: Check for per-prayer specific template
        const prayerKey = prayerName.toLowerCase();
        if (config.wabot?.prayerNotifications && config.wabot.prayerNotifications[prayerKey]?.template) {
            template = config.wabot.prayerNotifications[prayerKey].template!;
        } else if (isImsak && config.wabot?.imsakMessageTemplate) {
            // Legacy/Fallback for Imsak
            template = config.wabot.imsakMessageTemplate;
        }

        // Simple template replacement
        const message = template
            .replace(/{sholat}/gi, prayerName)
            .replace(/{jam}/gi, timeStr)
            .replace(/\[HH:MM\]/gi, timeStr);

        let finalMessage = message;

        // WhatsApp Sending (Local Service)
        const { waService } = await import('./wa-service');
        const targetJid = config.wabot?.targetNumber;

        if (targetJid) {
            try {
                console.log(`[Worker] Sending notification for ${prayerName} to ${targetJid}...`);
                await waService.sendMessage(mosqueKey, targetJid, finalMessage);
            } catch (error: any) {
                console.error(`[Worker] Failed to send message via local WA:`, error.message);
            }
        }

    } catch (e: any) {
        logger.error(`[Worker] Error sending message`, { error: e.message, key: mosqueKey });
    }
}

async function triggerReminderWabot(mosqueKey: string, config: MosqueConfig, prayerName: string, prayerTime: Date, reminderMinutes: number) {
    try {
        const timeStr = formatTime(prayerTime);
        const prayerKey = prayerName.toLowerCase();

        // Choose reminder template — per-prayer override → global default
        const perPrayerReminder = config.wabot?.prayerNotifications?.[prayerKey]?.reminderTemplate;
        const template = perPrayerReminder
            || `⏰ Reminder: Waktu {sholat} akan tiba dalam {menit} menit ({jam}). Segera bersiap!`;

        const message = template
            .replace(/{sholat}/gi, prayerName)
            .replace(/{jam}/gi, timeStr)
            .replace(/{menit}/gi, String(reminderMinutes))
            .replace(/\[HH:MM\]/gi, timeStr);

        const { waService } = await import('./wa-service');
        const targetJid = config.wabot?.targetNumber;

        if (targetJid) {
            try {
                console.log(`[Worker] Sending reminder for ${prayerName} (${reminderMinutes}min before) to ${targetJid}...`);
                await waService.sendMessage(mosqueKey, targetJid, message);
            } catch (error: any) {
                console.error(`[Worker] Failed to send reminder via local WA:`, error.message);
            }
        }

    } catch (e: any) {
        logger.error(`[Worker] Error sending reminder`, { error: e.message, key: mosqueKey });
    }
}
