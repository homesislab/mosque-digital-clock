import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
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

        // Save to public/uploads
        // Note: In dev, this saves to the project folder. In prod (Docker), this needs a volume.
        const path = join(process.cwd(), 'public', 'uploads', filename);
        await writeFile(path, buffer);

        // Construct public URL
        // We return the relative path, client UI will handle the domain if needed,
        // or better, we return the full URL if we knew the host.
        // For now, let's return just the path and let the UI prepend the origin.
        const url = `/uploads/${filename}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
