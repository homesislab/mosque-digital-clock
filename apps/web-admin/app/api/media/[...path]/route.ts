import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// import mime from 'mime'; // You might need to install 'mime' or 'mime-types', or just simple lookup

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    // Await params first (Next.js 15+ requirement)
    const { path: pathSegments } = await params;

    // Construct file path
    // We know uploads are in public/uploads
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

    // Security check: Ensure we don't escape public/uploads
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsRoot)) {
        return new NextResponse('Access Denied', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File Not Found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
        return new NextResponse('Not a File', { status: 400 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Simple mime type detection (manual for now to avoid dependency if possible, or use one if installed)
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.mp4') contentType = 'video/mp4';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
