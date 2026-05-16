import mysql from 'mysql2/promise';

console.log('Initializing database pool...');
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL is', dbUrl ? 'DEFINED' : 'UNDEFINED');

// Validate required database environment variables
const requiredDbEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
if (!dbUrl) {
    const missingVars = requiredDbEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
    }
}

const pool = dbUrl
    ? mysql.createPool(dbUrl)
    : mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

export default pool;
