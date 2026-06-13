
const mysql = require('mysql2/promise');

async function testConfig() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Missing DATABASE_URL env var');
    const pool = mysql.createPool(dbUrl);

    try {
        const [rows] = await pool.query('SELECT * FROM mosque_configs');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

testConfig();
