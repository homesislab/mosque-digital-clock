export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CDN_INFO_URL = 'https://cdn.islamic.network/quran/info/by-surah/info.json';
const API_EDITIONS_URL = 'https://api.alquran.cloud/v1/edition?format=audio';

interface EditionInfo {
    identifier: string;
    englishName: string;
    name: string;
    language: string;
    surahCount: number;
}

let cachedEditions: EditionInfo[] | null = null;
let cacheTimestamp = 0;

/**
 * Parse the CDN directory listing JSON to extract edition identifiers
 * and how many surahs each has at 128kbps.
 */
function parseCdnEditions(cdnJson: any[]): Map<string, number> {
    const result = new Map<string, number>();
    try {
        // Structure: [{ type: "directory", name: "/mnt/.../audio-surah", contents: [
        //   { type: "directory", name: "128", contents: [
        //     { type: "directory", name: "ar.alafasy", contents: [...files] }
        //   ]}
        // ]}]
        const root = cdnJson[0];
        const bitrate128 = root?.contents?.find((d: any) => d.name === '128');
        if (!bitrate128) return result;

        for (const edition of bitrate128.contents || []) {
            if (edition.type === 'directory') {
                const mp3Files = (edition.contents || []).filter(
                    (f: any) => f.type === 'file' && f.name.endsWith('.mp3')
                );
                result.set(edition.name, mp3Files.length);
            }
        }
    } catch (e) {
        console.error('[Quran Editions] Failed to parse CDN JSON', e);
    }
    return result;
}

export async function GET() {
    try {
        const now = Date.now();
        if (cachedEditions && now - cacheTimestamp < CACHE_TTL) {
            return NextResponse.json({ success: true, data: cachedEditions });
        }

        // Fetch both sources in parallel
        const [cdnRes, apiRes] = await Promise.allSettled([
            fetch(CDN_INFO_URL, { next: { revalidate: 86400 } }),
            fetch(API_EDITIONS_URL, { next: { revalidate: 86400 } }),
        ]);

        // Parse CDN — list of editions that ACTUALLY have files
        let cdnEditions = new Map<string, number>();
        if (cdnRes.status === 'fulfilled' && cdnRes.value.ok) {
            const cdnJson = await cdnRes.value.json();
            cdnEditions = parseCdnEditions(cdnJson);
        } else {
            console.warn('[Quran Editions] CDN info fetch failed, falling back to API only');
        }

        // Parse API — name metadata
        const apiNameMap = new Map<string, { englishName: string; name: string; language: string }>();
        if (apiRes.status === 'fulfilled' && apiRes.value.ok) {
            const apiJson = await apiRes.value.json();
            for (const e of apiJson.data || []) {
                apiNameMap.set(e.identifier, {
                    englishName: e.englishName,
                    name: e.name,
                    language: e.language,
                });
            }
        }

        let editions: EditionInfo[];

        if (cdnEditions.size > 0) {
            // Use CDN as ground truth — only show editions that truly exist
            editions = [];
            for (const [identifier, surahCount] of cdnEditions.entries()) {
                const meta = apiNameMap.get(identifier);
                editions.push({
                    identifier,
                    englishName: meta?.englishName || formatIdentifier(identifier),
                    name: meta?.name || identifier,
                    language: meta?.language || 'ar',
                    surahCount,
                });
            }
            // Sort: full Quran (114 surahs) first, then alphabetical by englishName
            editions.sort((a, b) => {
                const aFull = a.surahCount >= 114 ? 0 : 1;
                const bFull = b.surahCount >= 114 ? 0 : 1;
                if (aFull !== bFull) return aFull - bFull;
                return a.englishName.localeCompare(b.englishName);
            });
        } else {
            // Fallback: use API data only
            editions = [...apiNameMap.entries()].map(([identifier, meta]) => ({
                identifier,
                englishName: meta.englishName,
                name: meta.name,
                language: meta.language,
                surahCount: 114,
            }));
        }

        cachedEditions = editions;
        cacheTimestamp = now;

        return NextResponse.json({ success: true, data: editions, total: editions.length });
    } catch (error) {
        console.error('[Quran Editions API]', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch editions', error: String(error) },
            { status: 500 }
        );
    }
}

/** Convert "ar.alafasy" → "Alafasy" style display name as fallback */
function formatIdentifier(id: string): string {
    const part = id.includes('.') ? id.split('.').slice(1).join(' ') : id;
    return part
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, c => c.toUpperCase());
}
