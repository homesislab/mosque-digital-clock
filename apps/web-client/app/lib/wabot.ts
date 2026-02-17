
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

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
        console.log('[Wabot] Skipped Not Configured');
        return false;
    }

    let template = config.wabot.messageTemplate || "Waktu sholat {sholat} telah tiba.";

    if (prayerName === 'Imsak' && config.wabot.imsakMessageTemplate) {
        template = config.wabot.imsakMessageTemplate;
    }

    const timeStr = prayerTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Simple template replacement
    const message = template
        .replace(/{sholat}/gi, prayerName)
        .replace(/{jam}/gi, timeStr);

    let finalMessage = message;

    // AI Generation Flow
    const isImsak = prayerName === 'Imsak';
    const useAi = isImsak ? config.wabot.imsakAiEnabled : config.wabot.aiEnabled;
    const aiPrompt = (isImsak ? config.wabot.imsakAiPrompt : config.wabot.aiPrompt) || "Buatkan pesan ajakan sholat {sholat} yang singkat, puitis, dan islami.";

    if (useAi && config.wabot.authToken) {
        try {
            console.log(`[Wabot] Generating AI message for ${prayerName}...`);
            const aiUrl = config.wabot.apiUrl.replace(/\/api\/messages\/send$/, '') + '/api/ai/chat'; // Heuristic to find base URL
            // Or better: assuming apiUrl is base, or we need to parse it. 
            // Usually user inputs 'https://api.wabotsisia.com', so we append /api/ai/chat
            // But currently config.wabot.apiUrl might be the full send endpoint '.../send'

            // Let's try to parse the base URL
            let baseUrl = config.wabot.apiUrl;
            if (baseUrl.endsWith('/api/messages/send')) {
                baseUrl = baseUrl.replace('/api/messages/send', '');
            } else if (baseUrl.endsWith('/send')) {
                baseUrl = baseUrl.replace('/send', '');
            }
            // Remove trailing slash
            baseUrl = baseUrl.replace(/\/$/, '');

            const actualPrompt = aiPrompt.replace(/{sholat}/gi, prayerName).replace(/{jam}/gi, timeStr);

            const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
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
                }
            } else {
                console.error('[Wabot] AI Generation failed:', await aiRes.text());
            }
        } catch (e) {
            console.error('[Wabot] AI Error:', e);
            // Fallback to template
        }
    }

    const payload: WabotPayload = {
        number: config.wabot.targetNumber,
        message: finalMessage
    };

    try {
        console.log('[Wabot] Sending to', config.wabot.apiUrl, payload);

        // Timeout handling
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000); // 10s timeout for AI + Send

        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        if (config.wabot.authToken) {
            headers['Authorization'] = `Bearer ${config.wabot.authToken}`;
        }

        const res = await fetch(config.wabot.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(id);

        if (!res.ok) {
            const txt = await res.text();
            console.error('[Wabot] Failed:', res.status, txt);
            return false;
        }

        const data = await res.json();
        console.log('[Wabot] Success:', data);
        return true;

    } catch (error) {
        console.error('[Wabot] Error:', error);
        return false;
    }
}
