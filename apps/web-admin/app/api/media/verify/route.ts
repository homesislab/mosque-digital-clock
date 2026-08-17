export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadsDir } from '@/lib/uploads-path';
import { validateAccess } from '@/lib/auth';

/**
 * POST /api/media/verify
 * Body: { key: string, urls: string[] }
 * Returns: { results: { url: string, exists: boolean }[] }
 *
 * Checks which gallery URLs actually exist on the filesystem.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, urls } = body as { key: string; urls: string[] };

        if (!key || !Array.isArray(urls)) {
            return NextResponse.json({ success: false, message: 'key and urls required' }, { status: 400 });
        }

        const access = await validateAccess(key);
        if (!access.allowed) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status });
        }

        const uploadsRoot = getUploadsDir();

        const results = urls.map((url) => {
            // Only verify local /uploads/ paths — external http URLs are always assumed to exist
            if (url.startsWith('http')) {
                return { url, exists: true };
            }

            // Strip leading /uploads/ and build filesystem path
            const relative = url.replace(/^\/uploads\//, '');
            const filePath = path.join(uploadsRoot, relative);

            // Security: prevent path traversal
            if (!filePath.startsWith(uploadsRoot)) {
                return { url, exists: false };
            }

            return { url, exists: fs.existsSync(filePath) && fs.statSync(filePath).isFile() };
        });

        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error('[media/verify] error:', err);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
