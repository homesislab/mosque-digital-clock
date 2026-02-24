
const mysql = require('mysql2/promise');

async function testConfig() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'mosque_user',
        password: 'Moalnyaho135',
        database: 'mosque-digitaldb',
    });

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
