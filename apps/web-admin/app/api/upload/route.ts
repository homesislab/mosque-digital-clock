export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ success: false, message: 'Mosque key required for upload' }, { status: 400 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Use original filename (sanitized)
        const filename = file.name.replace(/\s+/g, '-');

        // Isolation: public/uploads/{key}/{filename}
        const cwd = process.cwd();
        console.log('Upload Debug - CWD:', cwd);

        // Fix for Docker monorepo structure:
        // If running from /app, but files are in apps/web-admin, we might need to adjust
        // But let's log first to see what's happening.

        const uploadDir = join(cwd, 'public', 'uploads', key);
        console.log('Upload Debug - Target Dir:', uploadDir);

        // Ensure directory exists
        const fs = require('fs/promises');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (mkdirError) {
            console.error('Upload Debug - Mkdir Error:', mkdirError);
            throw mkdirError;
        }

        const path = join(uploadDir, filename);
        console.log('Upload Debug - Writing to:', path);

        await writeFile(path, buffer);
        console.log('Upload Debug - Write Success');

        // Construct public URL
        const url = `/uploads/${key}/${filename}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Upload failed',
            debug: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
