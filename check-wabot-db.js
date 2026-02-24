
const mysql = require('mysql2/promise');

async function checkWabotUserTable() {
    const connection = await mysql.createConnection('mysql://sisia_user:Moalnyaho135@localhost:3306/sisiadb');
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
