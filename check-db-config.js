const mysql = require('mysql2/promise');

async function checkConfig() {
    const dbUrl = 'mysql://mosque_user:Moalnyaho135@mariadb_server:3306/mosque-digitaldb';
    try {
        const connection = await mysql.createConnection(dbUrl);
        const [rows] = await connection.execute('SELECT config_json FROM mosque_configs LIMIT 1');
        if (rows.length > 0) {
            console.log(JSON.stringify(JSON.parse(rows[0].config_json), null, 2));
        } else {
            console.log('No configuration found in database.');
        }
        await connection.end();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
}

checkConfig();
