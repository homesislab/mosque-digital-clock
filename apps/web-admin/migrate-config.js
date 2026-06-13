const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Starting config normalization data migration...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl && !process.env.DB_PASSWORD) {
        throw new Error('Missing DB connection environment variables');
    }

    const connection = await mysql.createConnection(dbUrl || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'mosque_user',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'mosque-digitaldb',
    });

    try {
        const [rows] = await connection.query('SELECT mosque_key, config_json FROM mosque_configs');
        console.log(`Found ${rows.length} configs to migrate.`);

        for (const row of rows) {
            const key = row.mosque_key;
            let config;
            try {
                config = JSON.parse(row.config_json);
            } catch (e) {
                console.error(`Invalid JSON for mosque_key: ${key}`);
                continue;
            }

            await connection.beginTransaction();

            try {
                // 1. Finance Accounts
                if (config.finance && Array.isArray(config.finance.accounts)) {
                    await connection.query('DELETE FROM finance_accounts WHERE mosque_key = ?', [key]);
                    for (const acc of config.finance.accounts) {
                        await connection.query(
                            'INSERT INTO finance_accounts (mosque_key, name, balance, income, expense) VALUES (?, ?, ?, ?, ?)',
                            [key, acc.name, acc.balance || 0, acc.income || 0, acc.expense || 0]
                        );
                    }
                }

                // 2. Running Text
                if (Array.isArray(config.runningText)) {
                    await connection.query('DELETE FROM running_text_items WHERE mosque_key = ?', [key]);
                    let pos = 0;
                    for (const txt of config.runningText) {
                        if (!txt) continue;
                        await connection.query(
                            'INSERT INTO running_text_items (mosque_key, position, text) VALUES (?, ?, ?)',
                            [key, pos++, txt]
                        );
                    }
                }

                // 3. Slider Images
                if (Array.isArray(config.sliderImages)) {
                    await connection.query('DELETE FROM slider_images WHERE mosque_key = ?', [key]);
                    let pos = 0;
                    for (const img of config.sliderImages) {
                        if (!img) continue;
                        await connection.query(
                            'INSERT INTO slider_images (mosque_key, position, image_url) VALUES (?, ?, ?)',
                            [key, pos++, img]
                        );
                    }
                }

                // 4. Gallery Images
                if (Array.isArray(config.gallery)) {
                    await connection.query('DELETE FROM gallery_images WHERE mosque_key = ?', [key]);
                    let pos = 0;
                    for (const img of config.gallery) {
                        if (!img) continue;
                        await connection.query(
                            'INSERT INTO gallery_images (mosque_key, position, image_url) VALUES (?, ?, ?)',
                            [key, pos++, img]
                        );
                    }
                }

                // 5. Update the JSON blob to strip the arrays
                const jsonConfig = { ...config };
                if (jsonConfig.finance) jsonConfig.finance.accounts = [];
                jsonConfig.runningText = [];
                jsonConfig.sliderImages = [];
                jsonConfig.gallery = [];
                
                await connection.query(
                    'UPDATE mosque_configs SET config_json = ? WHERE mosque_key = ?',
                    [JSON.stringify(jsonConfig), key]
                );

                await connection.commit();
                console.log(`Migrated mosque_key: ${key}`);
            } catch (innerError) {
                await connection.rollback();
                console.error(`Migration failed for ${key}:`, innerError);
            }
        }
    } finally {
        await connection.end();
        console.log('Migration completed.');
    }
}

migrate().catch(console.error);
