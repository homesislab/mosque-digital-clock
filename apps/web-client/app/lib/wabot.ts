import { MosqueConfig } from '@mosque-digital-clock/shared-types';
import { logger } from './logger-standalone';

interface WabotPayload {
    number: string;
    message: string;
}

export async function sendWabotNotification(
    config: MosqueConfig,
    prayerName: string,
    prayerTime: Date
): Promise<boolean> {
    if (!config.wabot?.enabled || !config.wabot.apiUrl || !config.wabot.targetNumber) {
        console.log('[Wabot] Skipped: Not Configured');
        return false;
    }

    // Client-side Deduplication (1 minute window)
    const storeKey = `wabot_sent_${prayerName}_${prayerTime.getTime()}`;
    if (typeof window !== 'undefined') {
        const lastSent = localStorage.getItem(storeKey);
        if (lastSent && (Date.now() - parseInt(lastSent)) < 60000) {
            console.log(`[Wabot] Skipped: Already sent recently (${prayerName})`);
            return false;
        }
        localStorage.setItem(storeKey, Date.now().toString());
    }

    let template = config.wabot.messageTemplate || "Waktu sholat {sholat} telah tiba.";

    if (prayerName === 'Imsak') {
        template = config.wabot.imsakMessageTemplate ||
            (config.wabot.messageTemplate ? config.wabot.messageTemplate.replace(/sholat /gi, '') : "Waktu {sholat} telah tiba.");
    }

    const timeStr = prayerTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Simple template replacement
    const message = template
        .replace(/{sholat}/gi, prayerName)
        .replace(/{jam}/gi, timeStr)
        .replace(/\[HH:MM\]/gi, timeStr); // Handle potential leftovers

    let finalMessage = message;

    // AI Generation Flow
    const isImsak = prayerName === 'Imsak';
    const useAi = isImsak ? config.wabot.imsakAiEnabled : config.wabot.aiEnabled;
    const aiPrompt = (isImsak ? config.wabot.imsakAiPrompt : config.wabot.aiPrompt) ||
        (isImsak
            ? "Buatkan pesan pengingat waktu {sholat} yang singkat dan bermanfaat."
            : "Buatkan pesan ajakan sholat {sholat} yang singkat, puitis, dan islami.");

    // URL Normalization
    const baseUrl = config.wabot.apiUrl.replace(/\/$/, '').replace(/\/api\/messages\/send$/, '').replace(/\/send$/, '');
    const sendUrl = `${baseUrl}/api/messages/send`;

    if (useAi && config.wabot.authToken) {
        try {
            console.log(`[Wabot] Generating AI message for ${prayerName}...`);
            const aiUrl = `${baseUrl}/api/ai/chat`;

            const actualPrompt = aiPrompt.replace(/{sholat}/gi, prayerName).replace(/{jam}/gi, timeStr);

            logger.info(`[Wabot] Requesting AI for ${prayerName}`, { prayerName, prompt: actualPrompt });
            const aiRes = await fetch(aiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.wabot.authToken}`
                },
                body: JSON.stringify({
                    message: actualPrompt,
                    systemInstruction: "You are a helpful assistant for a Mosque. Keep messages short, polite, and inspiring. Bahasa Indonesia."
                })
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                if (aiData.response) {
                    finalMessage = aiData.response;
                    console.log('[Wabot] AI Generated:', finalMessage);
                    logger.info(`[Wabot] AI message generated for ${prayerName}`, { prayerName, message: finalMessage });
                }
            } else {
                const errorText = await aiRes.text();
                console.error('[Wabot] AI Generation failed:', errorText);
                logger.warn(`[Wabot] AI Generation failed for ${prayerName}`, { prayerName, error: errorText });
            }
        } catch (e: any) {
            console.error('[Wabot] AI Error:', e);
            logger.error(`[Wabot] AI Generation Error for ${prayerName}`, { prayerName, error: e.message });
        }
    }

    // Payload for Wabot Sisia API
    const payload = {
        sessionId: config.wabot.sessionId,
        to: config.wabot.targetNumber,
        type: 'TEXT',
        content: finalMessage
    };

    try {
        console.log('[Wabot] Sending to', sendUrl, payload);

        // Timeout handling
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 15000); // 15s timeout for AI + Send

        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        if (config.wabot.authToken) {
            headers['Authorization'] = `Bearer ${config.wabot.authToken}`;
        }

        logger.info(`[Wabot] Sending message for ${prayerName}`, { prayerName, to: config.wabot.targetNumber, message: finalMessage });
        const res = await fetch(sendUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(id);

        if (!res.ok) {
            const txt = await res.text();
            console.error('[Wabot] Failed:', res.status, txt);
            logger.error(`[Wabot] Failed to send notification for ${prayerName}`, { prayerName, status: res.status, response: txt });
            return false;
        }

        const data = await res.json();
        console.log('[Wabot] Success:', data);
        logger.success(`[Wabot] Notification sent for ${prayerName}`, { prayerName, time: timeStr });
        return true;

    } catch (error) {
        console.error('[Wabot] Error:', error);
        return false;
    }
}
