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

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const row of rows) {
            const key = row.mosque_key;
            let config: MosqueConfig;

            try {
                config = JSON.parse(row.config_json);
            } catch (e) {
                console.error(`[Worker] Failed to parse config for ${key}`, e);
                continue;
            }

            if (!config.wabot?.enabled) continue;

            const prayers = getPrayerTimes(config);
            if (!prayers) continue;

            // Check each prayer time
            Object.entries(prayers).forEach(async ([name, time]) => {
                // We only care about Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya
                // Normalized names for display/sending
                const displayNames: Record<string, string> = {
                    imsak: 'Imsak',
                    subuh: 'Subuh',
                    dzuhur: 'Dzuhur',
                    ashar: 'Ashar',
                    maghrib: 'Maghrib',
                    isya: 'Isya'
                };

                const displayName = displayNames[name];
                if (!displayName) return; // Skip Syuruq or others if not needed

                if (time instanceof Date) {
                    // Check if TIME MATCHES CURRENT MINUTE
                    if (time.getHours() === currentHour && time.getMinutes() === currentMinute) {

                        // Deduplication Key
                        const lockKey = `${key}_${name}_${now.getDate()}_${currentHour}_${currentMinute}`;

                        if (sentNotifications.has(lockKey)) {
                            // Already sent
                            return;
                        }

                        console.log(`[Worker] Triggering ${displayName} for ${key} at ${formatTime(time)}`);

                        // Mark as sent
                        sentNotifications.add(lockKey);

                        // Trigger Sending Logic
                        // We can reuse the internal API logic or call a service function directly.
                        // For simplicity and consistency with logging/headers, let's call the internal API via fetch
                        // essentially simulating a client request but from localhost

                        await triggerWabot(config, displayName, time);
                    }
                }
            });
        }

    } catch (error) {
        console.error('[Worker] Error in check loop:', error);
    }
}

async function triggerWabot(config: MosqueConfig, prayerName: string, prayerTime: Date) {
    // We need to implement the actual sending logic here OR call the existing API.
    // Calling the existing API might be tricky if it expects specific headers or auth that we don't have easily here.
    // BETTER APPROACH: Duplicate the sending logic here or move it to a shared service file.
    // Let's implement a simplified sending function here to avoid circular dependency loop with API routes if possible.

    // BUT wait, the previous `sendWabotNotification` was in `web-client`. We don't have it in `web-admin` yet.
    // We need to implement `sendWabotNotification` for server-side use.

    try {
        if (!config.wabot?.authToken) {
            // Auth check (using authToken as standard now)
        }

        const timeStr = formatTime(prayerTime);
        let template = config.wabot?.messageTemplate || "Waktu sholat {sholat} telah tiba.";

        if (prayerName === 'Imsak') {
            template = config.wabot?.imsakMessageTemplate ||
                (config.wabot?.messageTemplate ? config.wabot.messageTemplate.replace(/sholat /gi, '') : "Waktu {sholat} telah tiba.");
        }

        let message = template
            .replace(/{sholat}/gi, prayerName)
            .replace(/{jam}/gi, timeStr)
            .replace(/\[HH:MM\]/gi, timeStr);

        // AI Generation (Server-side)
        // Implemented if needed, for now let's stick to basic template to ensure stability first
        // or copy the AI logic if critical.

        // Send to Wabot
        const baseUrl = config.wabot?.apiUrl?.replace(/\/$/, '').replace(/\/api\/messages\/send$/, '').replace(/\/send$/, '');
        const sendUrl = `${baseUrl}/api/messages/send`;

        const payload = {
            sessionId: config.wabot?.sessionId,
            to: config.wabot?.targetNumber,
            type: 'TEXT',
            content: message
        };

        // NOTE: We are NOT using the AI generation here yet to keep it simple and robust for the worker.
        // If AI is needed, we should abstract that logic into a service.

        console.log(`[Worker] Sending to ${sendUrl}`, payload);

        const res = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.wabot?.authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            logger.success(`[Worker] Sent notification for ${prayerName}`, { key: 'SYSTEM', prayerName });
        } else {
            const err = await res.text();
            logger.error(`[Worker] Failed to send ${prayerName}`, { error: err });
        }

    } catch (e: any) {
        logger.error(`[Worker] Error sending message`, { error: e.message });
    }
}
