import { join } from 'path';

/**
 * Get the correct base uploads directory.
 *
 * When running in the Docker container:
 *   - WORKDIR = /app  (process.cwd())
 *   - Volume mount = /app/apps/web-admin/public/uploads
 *   - Next.js app root = /app/apps/web-admin
 *
 * When running locally (development):
 *   - process.cwd() = /path/to/apps/web-admin  (npm run dev from workspace root)
 *   - uploads = /path/to/apps/web-admin/public/uploads
 *
 * We detect Docker by checking if the resolved "public" dir exists at
 * process.cwd()/public vs process.cwd()/apps/web-admin/public.
 */
export function getUploadsDir(...segments: string[]): string {
    const cwd = process.cwd(); // /app in Docker, /path/to/apps/web-admin locally

    // In Docker: cwd=/app, app lives at apps/web-admin
    // Check if apps/web-admin/public exists under cwd (Docker case)
    const dockerPath = join(cwd, 'apps', 'web-admin', 'public', 'uploads', ...segments);
    const localPath = join(cwd, 'public', 'uploads', ...segments);

    // Simple heuristic: if cwd is /app (Docker), use the docker path
    // Otherwise use local path
    if (cwd === '/app' || cwd.endsWith('/app')) {
        return dockerPath;
    }
    return localPath;
}

/**
 * Get the URL path for an uploaded file (for serving via Next.js static files).
 * Returns a URL like /uploads/{key}/{filename}
 */
export function getUploadUrl(key: string, ...segments: string[]): string {
    return '/uploads/' + [key, ...segments].join('/');
}
