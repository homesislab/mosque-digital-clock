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

        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '-' + file.name.replace(/\s+/g, '-');

        // Isolation: public/uploads/{key}/{filename}
        const uploadDir = join(process.cwd(), 'public', 'uploads', key);

        // Ensure directory exists
        const fs = require('fs/promises');
        await fs.mkdir(uploadDir, { recursive: true });

        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        // Construct public URL
        const url = `/uploads/${key}/${filename}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
