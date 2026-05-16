export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

import { NextResponse, NextRequest } from 'next/server';
import { mkdir, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';
import { findUserById } from '@/lib/user-store';
import { getUploadsDir } from '@/lib/uploads-path';

const CDN_BASE = 'https://cdn.islamic.network/quran/audio-surah';

async function validateAdmin(key: string): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('admin-session')?.value;
        if (!userId) return false;
        const user = await findUserById(userId);
        if (!user) return false;
        if (key !== 'default' && !user.mosqueKeys.includes(key)) return false;
        return true;
    } catch {
        return false;
    }
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\-_.]/g, '').replace(/\s+/g, '-');
}

function padNumber(n: number): string {
    return String(n).padStart(3, '0');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mosqueKey, edition, surahNumber, surahName, surahEnglishName, bitrate = 128 } = body;

        if (!mosqueKey || !edition || !surahNumber) {
            return NextResponse.json(
                { success: false, message: 'mosqueKey, edition, and surahNumber are required' },
                { status: 400 }
            );
        }

        const isAdmin = await validateAdmin(mosqueKey);
        if (!isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Build CDN URL
        const cdnUrl = `${CDN_BASE}/${bitrate}/${edition}/${surahNumber}.mp3`;

        // Build local path
        const safeEdition = sanitizeFilename(edition);
        const paddedNum = padNumber(surahNumber);
        const safeName = sanitizeFilename(surahEnglishName || surahName || `Surah-${surahNumber}`);
        const filename = `${paddedNum}-${safeName}.mp3`;

        const uploadDir = getUploadsDir(mosqueKey, 'quran', safeEdition);
        await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, filename);

        // Check if already downloaded
        try {
            const existing = await stat(filePath);
            if (existing.isFile() && existing.size > 0) {
                const url = `/uploads/${mosqueKey}/quran/${safeEdition}/${filename}`;
                return NextResponse.json({
                    success: true,
                    url,
                    filename,
                    size: existing.size,
                    cached: true,
                    message: 'Already downloaded'
                });
            }
        } catch { /* Not found, proceed with download */ }

        // Download from CDN with 5-minute timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        let response: Response;
        try {
            response = await fetch(cdnUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'MosqueDigitalClock/1.0',
                },
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: `CDN returned ${response.status} for ${cdnUrl}`,
                    cdnUrl,
                },
                { status: 502 }
            );
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        if (buffer.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Downloaded file is empty' },
                { status: 502 }
            );
        }

        await writeFile(filePath, buffer);

        const url = `/uploads/${mosqueKey}/quran/${safeEdition}/${filename}`;

        console.log(`[Quran Download] Saved: ${filePath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

        return NextResponse.json({
            success: true,
            url,
            filename,
            size: buffer.length,
            cached: false,
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return NextResponse.json(
                { success: false, message: 'Download timed out (5 minutes exceeded)' },
                { status: 504 }
            );
        }
        console.error('[Quran Download API]', error);
        return NextResponse.json(
            { success: false, message: 'Download failed', error: String(error) },
            { status: 500 }
        );
    }
}
