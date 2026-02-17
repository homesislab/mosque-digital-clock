export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrayerTimes, formatTime } from '../../../lib/prayer-times';
import pool from '../../../lib/db';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export async function GET(request: Request) {
    try {
        // For simplicity, we just grab the first config or a default one to show "Server Time"
        // In a real multi-tenant admin, the admin might want to select WHICH mosque to view.
        // For now, let's grab the 'default' or first available one to verify the worker logic.

        const [rows]: any = await pool.query('SELECT config_json FROM mosque_configs LIMIT 1');
        let config: MosqueConfig | null = null;

        if (rows.length > 0) {
            config = JSON.parse(rows[0].config_json);
        }

        if (!config) {
            return NextResponse.json({ success: false, message: 'No config found' }, { status: 404 });
        }

        const prayers = getPrayerTimes(config);
        if (!prayers) {
            return NextResponse.json({ success: false, message: 'Invalid coordinates' }, { status: 400 });
        }

        const now = new Date();
        // Calculate formatted times
        const formattedPrayers: Record<string, string> = {
            Imsak: formatTime(prayers.imsak),
            Subuh: formatTime(prayers.subuh),
            Syuruq: formatTime(prayers.syuruq),
            Dzuhur: formatTime(prayers.dzuhur),
            Ashar: formatTime(prayers.ashar),
            Maghrib: formatTime(prayers.maghrib),
            Isya: formatTime(prayers.isya),
        };

        // Determine next prayer
        let nextPrayerName = '';
        let nextPrayerTime: Date | null = null;
        let minDiff = Infinity;

        const prayerList = [
            { name: 'Imsak', time: prayers.imsak },
            { name: 'Subuh', time: prayers.subuh },
            { name: 'Dzuhur', time: prayers.dzuhur },
            { name: 'Ashar', time: prayers.ashar },
            { name: 'Maghrib', time: prayers.maghrib },
            { name: 'Isya', time: prayers.isya },
        ];

        // Sort by time
        prayerList.sort((a, b) => a.time.getTime() - b.time.getTime());

        // Find next
        for (const p of prayerList) {
            const diff = p.time.getTime() - now.getTime();
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextPrayerName = p.name;
                nextPrayerTime = p.time;
            }
        }

        // If no next prayer today, pick first of tomorrow
        if (!nextPrayerTime) {
            nextPrayerName = 'Besok ' + prayerList[0].name;
            // Create tomorrow's date for the first prayer
            const tomorrow = new Date(prayerList[0].time);
            tomorrow.setDate(tomorrow.getDate() + 1);
            nextPrayerTime = tomorrow;
            minDiff = nextPrayerTime.getTime() - now.getTime();
        }

        const hours = Math.floor(minDiff / (1000 * 60 * 60));
        const minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
        const delta = `${hours}j ${minutes}m`;

        return NextResponse.json({
            success: true,
            prayers: formattedPrayers,
            next: {
                name: nextPrayerName,
                time: nextPrayerTime ? formatTime(nextPrayerTime) : '-',
                delta: delta
            }
        });

    } catch (error) {
        console.error('Status API Error:', error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
