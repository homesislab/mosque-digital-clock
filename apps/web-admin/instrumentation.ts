export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Prevent multiple instances in development
        if ((global as any).__WABOT_WORKER_STARTED) {
            console.log('[Instrumentation] Worker already running, skipping initialization');
            return;
        }
        (global as any).__WABOT_WORKER_STARTED = true;

        const { checkAndSendNotifications } = await import('./lib/notification-worker');

        console.log('[Instrumentation] Registering Background Worker...');

        // Run immediately on start
        checkAndSendNotifications();

        // Run every minute
        setInterval(async () => {
            await checkAndSendNotifications();
        }, 60 * 1000);
    }
}
