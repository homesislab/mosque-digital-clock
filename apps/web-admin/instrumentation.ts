export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Prevent multiple instances in development
        if ((global as any).__WABOT_WORKER_STARTED) {
            console.log('[Instrumentation] Worker already running, skipping initialization');
            return;
        }
        (global as any).__WABOT_WORKER_STARTED = true;

        const { checkAndSendNotifications } = await import('./lib/notification-worker');
        const { waService } = await import('./lib/wa-service');
        const pool = (await import('./lib/db')).default;

        console.log('[Instrumentation] Registering Background Worker...');

        // Initialize sessions for all mosques
        try {
            const [rows]: any = await pool.query('SELECT mosque_key, config_json FROM mosque_configs');
            for (const row of rows) {
                try {
                    const config = JSON.parse(row.config_json);
                    if (config.wabot?.enabled) {
                        console.log(`[Instrumentation] Initializing WA for ${row.mosque_key}`);
                        waService.init(row.mosque_key).catch(err => console.error(`[Instrumentation] WA Init Error for ${row.mosque_key}:`, err));
                    }
                } catch (e) {
                    // skip invalid config
                }
            }
        } catch (err) {
            console.error('[Instrumentation] Failed to load mosque keys:', err);
        }

        // Run immediately on start
        checkAndSendNotifications();

        // Run every minute
        setInterval(async () => {
            await checkAndSendNotifications();
        }, 60 * 1000);
    }
}
