import { SyncEvent } from '@mosque-digital-clock/shared-types';

class Broadcaster {
    // mosqueKey -> [deviceId -> controller]
    private clients: Map<string, Map<string, ReadableStreamDefaultController>> = new Map();
    private _heartbeatStarted = false;

    constructor() {
        this.startHeartbeat();
    }

    addClient(mosqueKey: string, deviceId: string, controller: ReadableStreamDefaultController) {
        if (!this.clients.has(mosqueKey)) {
            this.clients.set(mosqueKey, new Map());
        }
        
        const mosqueClients = this.clients.get(mosqueKey)!;
        const existing = mosqueClients.get(deviceId);
        
        if (existing) {
            try { existing.close(); } catch(e) {}
        }
        
        mosqueClients.set(deviceId, controller);
        console.log(`[SSE] Client added to ${mosqueKey}: ${deviceId}. Total mosque clients: ${mosqueClients.size}`);
    }

    removeClient(mosqueKey: string, deviceId: string) {
        const mosqueClients = this.clients.get(mosqueKey);
        if (mosqueClients) {
            mosqueClients.delete(deviceId);
            if (mosqueClients.size === 0) {
                this.clients.delete(mosqueKey);
            }
            console.log(`[SSE] Client removed from ${mosqueKey}: ${deviceId}`);
        }
    }

    broadcast(mosqueKey: string, event: SyncEvent) {
        console.log(`[SSE] Broadcasting to ${mosqueKey}: ${event.type}`);
        const mosqueClients = this.clients.get(mosqueKey);
        if (!mosqueClients) return;

        const data = `data: ${JSON.stringify(event)}\n\n`;
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);

        mosqueClients.forEach((controller, deviceId) => {
            try {
                controller.enqueue(encodedData);
            } catch (err) {
                console.warn(`[SSE] Failed to send to ${deviceId}, removing.`);
                mosqueClients.delete(deviceId);
            }
        });
    }

    private sendHeartbeat() {
        if (this.clients.size === 0) return;
        
        const data = `: keep-alive\n\n`;
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        
        this.clients.forEach((mosqueClients) => {
            mosqueClients.forEach((controller, deviceId) => {
                try {
                    controller.enqueue(encodedData);
                } catch (err) {
                    mosqueClients.delete(deviceId);
                }
            });
        });
    }

    private startHeartbeat() {
        if (this._heartbeatStarted) return;
        this._heartbeatStarted = true;
        
        setInterval(() => {
            this.sendHeartbeat();
        }, 15000); // 15s heartbeat for better compatibility with proxies
    }
}

// Singleton for Next.js App Router (Dev HMR safe)
const globalForBroadcaster = global as unknown as { broadcaster: Broadcaster };
export const broadcaster = globalForBroadcaster.broadcaster || new Broadcaster();

if (process.env.NODE_ENV !== 'production') globalForBroadcaster.broadcaster = broadcaster;
