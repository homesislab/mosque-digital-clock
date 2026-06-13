const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
    const dbUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL is', dbUrl ? 'DEFINED' : 'UNDEFINED');

    // SECURITY: never keep fallback hardcoded credentials in source.
    // Require DATABASE_URL (recommended) or explicit env vars.
    if (!dbUrl && !process.env.DB_PASSWORD) {
        throw new Error('Missing DATABASE_URL or DB_PASSWORD env var');
    }

    const connectionConfig = dbUrl || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'mosque_user',
        password: process.env.DB_PASSWORD,
    };

    const connection = await mysql.createConnection({
        ...(typeof connectionConfig === 'string' ? { uri: connectionConfig } : connectionConfig),
        multipleStatements: true
    });

    try {
        console.log('Creating database if not exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS `mosque-digitaldb`');
        await connection.query('USE `mosque-digitaldb`');

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await connection.query(schema);

        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initDb();
