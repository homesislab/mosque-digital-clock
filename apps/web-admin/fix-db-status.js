const mysql = require('mysql2/promise');
// require('dotenv').config();

async function fixDb() {
    const dbUrl = process.env.DATABASE_URL || 'mysql://mosque_user:Moalnyaho135@localhost:3306/mosque-digitaldb';
    console.log('Connecting to database...');

    const connection = await mysql.createConnection(dbUrl);

    try {
        console.log('Checking devices table...');

        // Check if column exists
        const [columns] = await connection.query("SHOW COLUMNS FROM devices LIKE 'status'");

        if (columns.length === 0) {
            console.log('Column "status" missing. Adding it...');
            await connection.query("ALTER TABLE devices ADD COLUMN status VARCHAR(50) DEFAULT 'active'");
            console.log('Column "status" added successfully!');
        } else {
            console.log('Column "status" already exists.');
        }

    } catch (error) {
        console.error('Error fixing database:', error);
    } finally {
        await connection.end();
    }
}

fixDb();
