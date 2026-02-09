import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'mosque_user',
    password: 'Moalnyaho135',
    database: 'mosque_digitaldb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
