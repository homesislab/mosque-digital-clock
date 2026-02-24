export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrayerTimes, formatTime, getNextPrayer } from '../../../lib/prayer-times';
import pool from '../../../lib/db';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mosqueKey = searchParams.get('key');

        let rows: any = [];
        if (mosqueKey) {
            const [data]: any = await pool.query('SELECT config_json FROM mosque_configs WHERE mosque_key = ?', [mosqueKey]);
            rows = data;
        } else {
            // Fallback for overview or single-tenant scenarios
            const [data]: any = await pool.query('SELECT config_json FROM mosque_configs LIMIT 1');
            rows = data;
        }

        let config: MosqueConfig | null = null;
        if (rows.length > 0) {
            config = JSON.parse(rows[0].config_json);
        }

        if (!config) {
            return NextResponse.json({ success: false, message: 'No config found' }, { status: 404 });
        }

        let now = new Date();
        if (config.display?.timeOffset) {
            now = new Date(now.getTime() + config.display.timeOffset * 1000);
        }

        const prayers: any = getPrayerTimes(config, now);
        if (!prayers) {
            return NextResponse.json({ success: false, message: 'Invalid coordinates' }, { status: 400 });
        }

        const isFriday = now.getDay() === 5;
        const dhuhrKey = isFriday ? 'jumat' : 'dzuhur';

        // Calculate formatted times
        const formattedPrayers: Record<string, string> = {
            Imsak: formatTime(prayers.imsak),
            Subuh: formatTime(prayers.subuh),
            Syuruq: formatTime(prayers.syuruq),
            [isFriday ? 'Jumat' : 'Dzuhur']: formatTime(prayers[dhuhrKey]),
            Ashar: formatTime(prayers.ashar),
            Maghrib: formatTime(prayers.maghrib),
            Isya: formatTime(prayers.isya),
        };

        const nextPrayer = getNextPrayer(prayers, now);

        return NextResponse.json({
            success: true,
            prayers: formattedPrayers,
            next: {
                name: nextPrayer.name,
                time: nextPrayer.time,
                delta: nextPrayer.delta
            }
        });

    } catch (error) {
        console.error('Status API Error:', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
