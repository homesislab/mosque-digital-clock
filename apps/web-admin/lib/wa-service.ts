import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { join } from 'path';
import { rmSync, readdirSync, unlinkSync, lstatSync } from 'fs';

const logger = pino({ level: 'info' });

interface WAKit {
    sock: any;
    qr: string | null;
    connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
    isInitializing: boolean;
    reconnectTimer?: NodeJS.Timeout;
}

class WAService {
    private sessions = new Map<string, WAKit>();
    private baseSessionPath: string;

    constructor() {
        this.baseSessionPath = join(process.cwd(), 'wa_auth_info');
        console.log(`[WA-Service] Base session path: ${this.baseSessionPath}`);
    }

    private getSessionPath(mosqueKey: string) {
        return join(this.baseSessionPath, mosqueKey);
    }

    private getKit(mosqueKey: string): WAKit {
        if (!this.sessions.has(mosqueKey)) {
            this.sessions.set(mosqueKey, {
                sock: null,
                qr: null,
                connectionStatus: 'DISCONNECTED',
                isInitializing: false,
                reconnectTimer: undefined
            });
        }
        return this.sessions.get(mosqueKey)!;
    }

    async init(mosqueKey: string = 'default') {
        const kit = this.getKit(mosqueKey);
        const sessionPath = this.getSessionPath(mosqueKey);

        if (kit.reconnectTimer) {
            clearTimeout(kit.reconnectTimer);
            kit.reconnectTimer = undefined;
        }

        if (kit.isInitializing) {
            console.log(`[WA-Service][${mosqueKey}] Already initializing...`);
            return;
        }

        if (kit.connectionStatus === 'CONNECTED') {
            console.log(`[WA-Service][${mosqueKey}] Already connected.`);
            return;
        }

        kit.isInitializing = true;
        kit.connectionStatus = 'CONNECTING';

        if (kit.sock) {
            try {
                kit.sock.ev.removeAllListeners('connection.update');
                kit.sock.ev.removeAllListeners('creds.update');
                kit.sock.end(undefined);
            } catch (e) {
                console.error(`[WA-Service][${mosqueKey}] Error ending old socket:`, e);
            }
        }

        try {
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
            const { version, isLatest } = await fetchLatestBaileysVersion();

            console.log(`[WA-Service][${mosqueKey}] using WA v${version.join('.')}, isLatest: ${isLatest}`);
            console.log(`[WA-Service][${mosqueKey}] Initializing with auth path: ${sessionPath}`);

            kit.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger),
                },
                logger,
                browser: ['Mosque Clock Admin', 'Chrome', '1.0.0'],
                syncFullHistory: false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 20000,
            });

            kit.sock.ev.on('creds.update', saveCreds);

            kit.sock.ev.on('connection.update', (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    kit.qr = qr;
                    console.log(`[WA-Service][${mosqueKey}] New QR Code generated`);
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    console.log(`[WA-Service][${mosqueKey}] Connection closed due to `, lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                    kit.connectionStatus = 'DISCONNECTED';
                    kit.qr = null;
                    kit.isInitializing = false;

                    if (statusCode === 401) {
                        console.log(`[WA-Service][${mosqueKey}] Session invalid (401). Cleaning up session directory...`);
                        try {
                            rmSync(sessionPath, { recursive: true, force: true });
                            console.log(`[WA-Service][${mosqueKey}] Cleanup complete. Retrying init for fresh QR...`);
                            this.init(mosqueKey);
                        } catch (e) {
                            console.error(`[WA-Service][${mosqueKey}] Cleanup failed:`, e);
                        }
                    } else if (shouldReconnect) {
                        console.log(`[WA-Service][${mosqueKey}] Reconnecting in 5 seconds...`);
                        kit.reconnectTimer = setTimeout(() => this.init(mosqueKey), 5000);
                    }
                } else if (connection === 'open') {
                    console.log(`[WA-Service][${mosqueKey}] Connection opened`);
                    kit.connectionStatus = 'CONNECTED';
                    kit.qr = null;
                    kit.isInitializing = false;
                } else if (connection === 'connecting') {
                    kit.connectionStatus = 'CONNECTING';
                }
            });
        } catch (error) {
            console.error(`[WA-Service][${mosqueKey}] Init failed:`, error);
            kit.isInitializing = false;
            kit.connectionStatus = 'DISCONNECTED';
        }
    }

    async sendMessage(mosqueKey: string, jid: string, text: string) {
        const kit = this.getKit(mosqueKey);
        if (!kit.sock || kit.connectionStatus !== 'CONNECTED') {
            throw new Error(`WhatsApp not connected for ${mosqueKey}`);
        }

        const targetJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;

        await kit.sock.sendMessage(targetJid, { text });
        console.log(`[WA-Service][${mosqueKey}] Message sent to ${targetJid}`);
    }

    async getGroups(mosqueKey: string) {
        const kit = this.getKit(mosqueKey);
        if (!kit.sock || kit.connectionStatus !== 'CONNECTED') {
            return [];
        }
        try {
            const groups = await kit.sock.groupFetchAllParticipating();
            return Object.values(groups).map((g: any) => ({
                id: g.id,
                name: g.subject
            }));
        } catch (e) {
            console.error(`[WA-Service][${mosqueKey}] Failed to fetch groups:`, e);
            return [];
        }
    }

    getStatus(mosqueKey: string) {
        const kit = this.getKit(mosqueKey);
        return {
            status: kit.connectionStatus,
            qr: kit.qr
        };
    }

    async resetSession(mosqueKey: string) {
        const kit = this.getKit(mosqueKey);
        const sessionPath = this.getSessionPath(mosqueKey);

        if (kit.reconnectTimer) {
            clearTimeout(kit.reconnectTimer);
            kit.reconnectTimer = undefined;
        }

        if (kit.sock) {
            try {
                kit.sock.ev.removeAllListeners('connection.update');
                kit.sock.ev.removeAllListeners('creds.update');
                kit.sock.logout('user requested logout');
                kit.sock.end(undefined);
            } catch (e) {
                console.error(`[WA-Service][${mosqueKey}] Error logging out socket:`, e);
            }
        }

        kit.sock = null;
        kit.qr = null;
        kit.connectionStatus = 'DISCONNECTED';
        kit.isInitializing = false;

        try {
            console.log(`[WA-Service][${mosqueKey}] Deleting session directory...`);
            rmSync(sessionPath, { recursive: true, force: true });
            console.log(`[WA-Service][${mosqueKey}] Session directory deleted.`);
        } catch (e) {
            console.error(`[WA-Service][${mosqueKey}] Error deleting session directory:`, e);
            throw new Error(`Gagal menghapus sesi: ${e}`);
        }
    }
}

// True Singleton instance to survive Next.js HMR, worker thread isolations, and production Webpack chunking
const globalForWA = globalThis as unknown as {
    __waService: WAService | undefined;
};

export const waService = globalForWA.__waService || new WAService();

// ALWAYS set it, even in production, because Next.js API routes and instrumentation 
// might be bundled into separate chunks that share the same globalThis process.
globalForWA.__waService = waService;
