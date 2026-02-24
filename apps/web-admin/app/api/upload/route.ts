export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ success: false, message: 'Mosque key required for upload' }, { status: 400 });
        }

        const data = await request.formData();
        const files: File[] = data.getAll('file') as unknown as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        const uploadedUrls = [];
        const fs = require('fs/promises');

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Use original filename (sanitized)
            const filename = file.name.replace(/\s+/g, '-');

            // Isolation: public/uploads/{key}/{filename}
            const cwd = process.cwd();
            const uploadDir = join(cwd, 'public', 'uploads', key);

            // Ensure directory exists
            await fs.mkdir(uploadDir, { recursive: true });

            const path = join(uploadDir, filename);
            await writeFile(path, buffer);

            const url = `/uploads/${key}/${filename}`;
            uploadedUrls.push(url);
        }

        return NextResponse.json({ success: true, urls: uploadedUrls });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Upload failed',
            debug: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
