import { getSessionUser } from './session-store';

/**
 * Otorisasi penuh: user harus login DAN memiliki mosque key terkait.
 * Dipakai untuk aksi yang menyentuh data/resource sebuah masjid
 * (config, devices, upload, kontrol WhatsApp, remote logout, dsb).
 */
export async function validateAccess(key: string) {
    const session = await getSessionUser();
    if (!session) return { allowed: false as const, status: 401 };

    if (!session.user.mosqueKeys.includes(key)) {
        return { allowed: false as const, status: 403 };
    }
    return { allowed: true as const, userId: session.user.id };
}

/**
 * Cek sesi ringan: cukup memastikan ada user yang login.
 * Dipakai untuk endpoint proxy (mis. relay Wabot) agar tidak menjadi
 * open-proxy / sasaran SSRF oleh pihak anonim.
 */
export async function requireSession() {
    const session = await getSessionUser();
    if (!session) return { allowed: false as const, status: 401 };
    return { allowed: true as const, userId: session.user.id };
}
