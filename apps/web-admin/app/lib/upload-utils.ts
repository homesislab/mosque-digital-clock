export async function uploadFileChunked(
    file: File,
    mosqueKey: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    // 5MB chunk size minimizes memory overhead and easily passes through proxies like Cloudflare/Nginx
    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
    let finalUrl = '';

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);

        // Metadata passed as query params
        const query = new URLSearchParams({
            key: mosqueKey,
            chunkIndex: i.toString(),
            totalChunks: totalChunks.toString(),
            filename: file.name,
            uploadId: uploadId
        });

        const res = await fetch(`/api/upload?${query.toString()}`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed at chunk ${i + 1}/${totalChunks}`);
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.message || `Upload failed at chunk ${i + 1}`);
        }

        if (i === totalChunks - 1) {
            finalUrl = data.url || (data.urls && data.urls[0]);
        }

        if (onProgress) {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
    }

    return finalUrl;
}
