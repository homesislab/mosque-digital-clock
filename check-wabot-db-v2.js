
const mysql = require('mysql2/promise');

async function checkWabotUserTable() {
    // Using the container IP found via docker network inspect
    const dbUrl = process.env.WABOT_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Missing WABOT_DATABASE_URL (or DATABASE_URL) env var');
    const connection = await mysql.createConnection(dbUrl);
    try {
        const [rows] = await connection.query('DESCRIBE User');
        console.log("User Table Description:");
        console.table(rows);

        const [users] = await connection.query('SELECT username, aiProvider, isAiEnabled FROM User');
        console.log("Users AI settings:");
        console.table(users);
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await connection.end();
    }
}

checkWabotUserTable();
