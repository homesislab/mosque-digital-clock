export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { writeFile, appendFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const chunkIndex = searchParams.get('chunkIndex');
        const totalChunks = searchParams.get('totalChunks');
        const originalFilename = searchParams.get('filename');
        const uploadId = searchParams.get('uploadId');

        if (!key) {
            return NextResponse.json({ success: false, message: 'Mosque key required for upload' }, { status: 400 });
        }

        const data = await request.formData();
        const files: File[] = data.getAll('file') as unknown as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        const cwd = process.cwd();
        const uploadDir = join(cwd, 'public', 'uploads', key);
        await mkdir(uploadDir, { recursive: true });

        // Handle Chunked Upload
        if (chunkIndex !== null && totalChunks !== null && uploadId && originalFilename) {
            const file = files[0];
            const buffer = Buffer.from(await file.arrayBuffer());
            const sanitizedFilename = originalFilename.replace(/\s+/g, '-');
            const chunkPath = join(uploadDir, `${uploadId}_${chunkIndex}.part`);

            await writeFile(chunkPath, buffer);

            const isLastChunk = parseInt(chunkIndex) === parseInt(totalChunks) - 1;

            if (isLastChunk) {
                const finalPath = join(uploadDir, sanitizedFilename);

                // Ensure pristine state by deleting existing file if any
                try { await unlink(finalPath); } catch (e) { /* ignore */ }

                // Assemble all chunks
                for (let i = 0; i < parseInt(totalChunks); i++) {
                    const cPath = join(uploadDir, `${uploadId}_${i}.part`);
                    try {
                        const fsPromises = require('fs/promises');
                        const chunkData = await fsPromises.readFile(cPath);
                        await appendFile(finalPath, chunkData);
                        await unlink(cPath);
                    } catch (err) {
                        console.error(`Failed to process chunk ${i}`, err);
                    }
                }

                const url = `/uploads/${key}/${sanitizedFilename}`;
                return NextResponse.json({ success: true, url, urls: [url] });
            }

            return NextResponse.json({ success: true, message: `Chunk ${chunkIndex} uploaded` });
        }

        // Handle Legacy / Normal Uploads (Multiple files allowed)
        const uploadedUrls = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = file.name.replace(/\s+/g, '-');
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
