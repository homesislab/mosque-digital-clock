export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const CACHE_TTL = 24 * 60 * 60 * 1000;

let cachedSurahs: any[] | null = null;
let cacheTimestamp = 0;

export async function GET() {
    try {
        const now = Date.now();
        if (cachedSurahs && now - cacheTimestamp < CACHE_TTL) {
            return NextResponse.json({ success: true, data: cachedSurahs });
        }

        const res = await fetch('https://api.alquran.cloud/v1/surah', {
            next: { revalidate: 86400 },
        });

        if (!res.ok) throw new Error(`AlQuran API error: ${res.status}`);

        const json = await res.json();

        const surahs = (json.data || []).map((s: any) => ({
            number: s.number,
            name: s.name,           // Arabic name
            englishName: s.englishName,
            englishNameTranslation: s.englishNameTranslation,
            numberOfAyahs: s.numberOfAyahs,
            revelationType: s.revelationType,
        }));

        cachedSurahs = surahs;
        cacheTimestamp = now;

        return NextResponse.json({ success: true, data: surahs });
    } catch (error) {
        console.error('[Quran Surahs API]', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch surahs', error: String(error) },
            { status: 500 }
        );
    }
}
