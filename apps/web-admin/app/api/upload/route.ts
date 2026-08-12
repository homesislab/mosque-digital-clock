export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { writeFile, appendFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { withRateLimit } from '../../../lib/rate-limit';
import { getUploadsDir } from '../../../lib/uploads-path';
import { validateAccess } from '@/lib/auth';

export const maxDuration = 300; // 5 minutes

// Hanya izinkan tipe media yang dipakai aplikasi (cegah unggah file berbahaya)
const ALLOWED_EXT = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm'];

async function handleUpload(request: NextRequest) {
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

        // ✅ Wajib login & key milik user (cegah unggah anonim / penyalahgunaan storage)
        const access = await validateAccess(key);
        if (!access.allowed) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: access.status });
        }

        const data = await request.formData();
        const files: File[] = data.getAll('file') as unknown as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        // ✅ Allowlist ekstensi (untuk chunked upload, cek nama file asli)
        const namesToCheck = originalFilename ? [originalFilename] : files.map((f) => f.name);
        for (const n of namesToCheck) {
            const ext = n.slice(n.lastIndexOf('.')).toLowerCase();
            if (!ALLOWED_EXT.includes(ext)) {
                return NextResponse.json({ success: false, message: `Ekstensi tidak diizinkan: ${ext}` }, { status: 415 });
            }
        }

        const uploadDir = getUploadsDir(key);
        await mkdir(uploadDir, { recursive: true });

        // Handle Chunked Upload
        if (chunkIndex !== null && totalChunks !== null && uploadId && originalFilename) {
            const file = files[0];
            const buffer = Buffer.from(await file.arrayBuffer());
            const sanitizedFilename = originalFilename.replace(/\s+/g, '-').replace(/[#?%&\\]+/g, '');
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
            const filename = file.name.replace(/\s+/g, '-').replace(/[#?%&\\]+/g, '');
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
            message: 'Upload failed'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return withRateLimit('/api/upload', request, () => handleUpload(request));
}
