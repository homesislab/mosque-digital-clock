import { AudioSyncStatus } from '@mosque-digital-clock/shared-types';

/**
 * Menyimpan laporan status sinkronisasi audio per-perangkat (in-memory),
 * mengikuti pola audio-status.ts. Key internal: `${mosqueKey}::${deviceId}`.
 *
 * Catatan: in-memory akan ter-reset bila server restart; client akan melapor
 * ulang pada sync berikutnya / saat online kembali.
 */
class AudioSyncStatusManager {
    private reports = new Map<string, AudioSyncStatus>();

    private k(mosqueKey: string, deviceId: string) {
        return `${mosqueKey}::${deviceId}`;
    }

    update(mosqueKey: string, report: AudioSyncStatus) {
        this.reports.set(this.k(mosqueKey, report.deviceId), {
            ...report,
            updatedAt: Date.now(),
        });
    }

    getForDevice(mosqueKey: string, deviceId: string): AudioSyncStatus | null {
        return this.reports.get(this.k(mosqueKey, deviceId)) || null;
    }

    listForKey(mosqueKey: string): AudioSyncStatus[] {
        const prefix = `${mosqueKey}::`;
        const out: AudioSyncStatus[] = [];
        for (const [k, v] of this.reports.entries()) {
            if (k.startsWith(prefix)) out.push(v);
        }
        return out.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    clear(mosqueKey: string, deviceId: string) {
        this.reports.delete(this.k(mosqueKey, deviceId));
    }
}

export const audioSyncStatusManager = new AudioSyncStatusManager();
