const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'mosque_user', // Fixed user as per request
        password: 'Moalnyaho135',
        multipleStatements: true
    });

    try {
        console.log('Creating database if not exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS mosque_digitaldb');
        await connection.query('USE mosque_digitaldb');

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
