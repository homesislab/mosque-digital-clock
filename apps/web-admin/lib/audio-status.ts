import { AudioActiveStatus } from '@mosque-digital-clock/shared-types';

class AudioStatusManager {
    private statuses = new Map<string, AudioActiveStatus>();
    private pendingLogouts = new Set<string>();

    getStatus(mosqueKey: string): AudioActiveStatus | null {
        const status = this.statuses.get(mosqueKey);
        if (!status) return null;

        // Auto-expire if not updated for 15 seconds
        const now = Date.now();
        if (now - status.updatedAt > 15000) {
            this.statuses.delete(mosqueKey);
            return null;
        }

        return status;
    }

    updateStatus(mosqueKey: string, status: AudioActiveStatus) {
        this.statuses.set(mosqueKey, {
            ...status,
            updatedAt: Date.now()
        });
    }

    clearStatus(mosqueKey: string) {
        this.statuses.delete(mosqueKey);
    }

    requestLogout(mosqueKey: string) {
        this.pendingLogouts.add(mosqueKey);
        // Clear after 30 seconds if not claimed
        setTimeout(() => this.pendingLogouts.delete(mosqueKey), 30000);
    }

    hasPendingLogout(mosqueKey: string): boolean {
        const has = this.pendingLogouts.has(mosqueKey);
        if (has) {
            this.pendingLogouts.delete(mosqueKey); // Claimed
        }
        return has;
    }
}

export const audioStatusManager = new AudioStatusManager();
