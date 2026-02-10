import mysql from 'mysql2/promise';

console.log('Initializing database pool...');
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL is', dbUrl ? 'DEFINED' : 'UNDEFINED');

if (dbUrl) {
    console.log('Using DATABASE_URL connection string');
} else {
    console.log('Using default object connection (mariadb_server)');
}

const pool = dbUrl
    ? mysql.createPool(dbUrl)
    : mysql.createPool({
        host: 'mariadb_server',
        user: 'mosque_user',
        password: 'Moalnyaho135',
        database: 'mosque-digitaldb',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });



export default pool;
