const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
    const dbUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL is', dbUrl ? 'DEFINED' : 'UNDEFINED');

    const connectionConfig = dbUrl || {
        host: 'localhost',
        user: 'mosque_user',
        password: 'Moalnyaho135',
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
