
const mysql = require('mysql2/promise');

async function testWabotDb() {
    const pool = mysql.createPool({
        host: 'localhost', // Assuming mariadb_server is also reachable via localhost 3306 or I'm on the same host
        user: 'sisia_user',
        password: 'Moalnyaho135',
        database: 'sisiadb',
    });

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
