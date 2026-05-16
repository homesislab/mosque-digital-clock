export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { cookies } from 'next/headers';
import { findUserById } from '@/lib/user-store';
import { getUploadsDir } from '@/lib/uploads-path';

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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key');
    const edition = searchParams.get('edition');

    if (!mosqueKey) {
        return NextResponse.json({ success: false, message: 'key is required' }, { status: 400 });
    }

    const isAdmin = await validateAdmin(mosqueKey);
    if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const baseDir = getUploadsDir(mosqueKey, 'quran');

        let files: { filename: string; url: string; size: number; edition: string; surahNumber: number; surahName: string }[] = [];

        // List all editions or a specific one
        let editions: string[] = [];
        try {
            const allEditions = await readdir(baseDir, { withFileTypes: true });
            editions = allEditions.filter(d => d.isDirectory()).map(d => d.name);
        } catch {
            // Directory doesn't exist yet
            return NextResponse.json({ success: true, data: [] });
        }

        if (edition) {
            editions = editions.filter(e => e === edition);
        }

        for (const ed of editions) {
            const edDir = join(baseDir, ed);
            try {
                const edFiles = await readdir(edDir);
                for (const f of edFiles) {
                    if (extname(f).toLowerCase() !== '.mp3') continue;
                    const filePath = join(edDir, f);
                    const fileStat = await stat(filePath);

                    // Parse filename: "001-Al-Fatihah.mp3" → surahNumber = 1, surahName = "Al-Fatihah"
                    const match = f.match(/^(\d+)-(.+)\.mp3$/);
                    const surahNumber = match ? parseInt(match[1]) : 0;
                    const surahName = match ? match[2].replace(/-/g, ' ') : f.replace('.mp3', '');

                    files.push({
                        filename: f,
                        url: `/uploads/${mosqueKey}/quran/${ed}/${f}`,
                        size: fileStat.size,
                        edition: ed,
                        surahNumber,
                        surahName,
                    });
                }
            } catch { /* skip */ }
        }

        // Sort by surah number
        files.sort((a, b) => a.surahNumber - b.surahNumber);

        return NextResponse.json({ success: true, data: files });
    } catch (error) {
        console.error('[Quran Files API GET]', error);
        return NextResponse.json(
            { success: false, message: 'Failed to list files', error: String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mosqueKey = searchParams.get('key');
    const edition = searchParams.get('edition');
    const filename = searchParams.get('filename');

    if (!mosqueKey || !edition || !filename) {
        return NextResponse.json({ success: false, message: 'key, edition, filename are required' }, { status: 400 });
    }

    const isAdmin = await validateAdmin(mosqueKey);
    if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Security: no path traversal
    if (filename.includes('..') || filename.includes('/') || edition.includes('..')) {
        return NextResponse.json({ success: false, message: 'Invalid path' }, { status: 400 });
    }

    try {
        const filePath = join(getUploadsDir(mosqueKey, 'quran', edition), filename);
        const uploadsRoot = getUploadsDir();
        if (!filePath.startsWith(uploadsRoot)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        await unlink(filePath);
        return NextResponse.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('[Quran Files API DELETE]', error);
        return NextResponse.json(
            { success: false, message: 'Delete failed', error: String(error) },
            { status: 500 }
        );
    }
}
