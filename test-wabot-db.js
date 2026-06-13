
const mysql = require('mysql2/promise');

async function testWabotDb() {
    const dbUrl = process.env.WABOT_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Missing WABOT_DATABASE_URL (or DATABASE_URL) env var');
    const pool = mysql.createPool(dbUrl);

    try {
        const [rows] = await pool.query('SELECT id, username, aiProvider, aiModel, aiApiKey FROM User');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

testWabotDb();
