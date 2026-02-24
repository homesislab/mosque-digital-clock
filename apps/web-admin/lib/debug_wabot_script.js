
const mysql = require('mysql2/promise');

async function debugWabot() {
    console.log('Starting Wabot Debug...');

    // Connect to DB using env vars (which should be present in the container)
    const dbUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', dbUrl ? 'Found' : 'Missing');

    const pool = mysql.createPool(dbUrl || {
        host: 'mariadb_server', // Default inside docker network
        user: 'mosque_user',
        password: 'Moalnyaho135',
        database: 'mosque-digitaldb',
    });

    try {
        const [rows] = await pool.query('SELECT mosque_key, config_json FROM mosque_configs');
        console.log(`Found ${rows.length} configs.`);

        for (const row of rows) {
            const key = row.mosque_key;
            console.log(`--- Checking Config for ${key} ---`);
            let config;
            try {
                config = JSON.parse(row.config_json);
            } catch (e) {
                console.error('Failed to parse config JSON');
                continue;
            }

            const wabot = config.wabot;

            if (!wabot) {
                console.log('No Wabot config found.');
                continue;
            }

            console.log('Wabot Enabled:', wabot.enabled);
            console.log('API URL:', wabot.apiUrl);
            console.log('Target Number:', wabot.targetNumber);

            const token = wabot.authToken;
            if (token) {
                console.log(`Auth Token: ${token.substring(0, 5)}...${token.substring(token.length - 5)} (Length: ${token.length})`);
            } else {
                console.log('Auth Token: MISSING or EMPTY');
            }

            if (wabot.enabled && wabot.apiUrl && wabot.targetNumber) {
                console.log('Attempting to send test message...');

                const baseUrl = wabot.apiUrl.replace(/\/$/, '').replace(/\/api\/messages\/send$/, '').replace(/\/send$/, '');
                const sendUrl = `${baseUrl}/api/messages/send`;

                const payload = {
                    sessionId: wabot.sessionId || 'default',
                    to: wabot.targetNumber,
                    type: 'TEXT',
                    content: 'Debug Test Message from Admin Console'
                };

                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`; // Use Bearer for now
                }

                console.log(`POST ${sendUrl}`);

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                    const res = await fetch(sendUrl, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    console.log('Response Status:', res.status, res.statusText);
                    const text = await res.text();
                    console.log('Response Body:', text);
                } catch (err) {
                    console.error('Fetch Error:', err);
                }
            }
        }

    } catch (e) {
        console.error('Database Error:', e);
    } finally {
        await pool.end();
    }
}

debugWabot();
