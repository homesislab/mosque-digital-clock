#!/bin/bash
# Database migration script for Google OAuth support
# Run this after updating the schema

set -e

echo "🔄 Running Google OAuth migration..."

# Check if database connection is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it before running this script."
    exit 1
fi

# Temporary Node script to run migrations
cat > /tmp/migrate-google-oauth.js << 'EOF'
const mysql = require('mysql2/promise');

async function runMigration() {
    const pool = process.env.DATABASE_URL
        ? mysql.createPool(process.env.DATABASE_URL)
        : mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'mosque_user',
            password: process.env.DB_PASSWORD || 'Moalnyaho135',
            database: process.env.DB_NAME || 'mosque-digitaldb',
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
        });

    const connection = await pool.getConnection();

    try {
        console.log('📝 Adding Google OAuth columns to users table...');
        
        // Add google_id column
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE
        `).catch(e => {
            if (!e.message.includes('already exists')) throw e;
            console.log('  ℹ️  google_id column already exists');
        });

        // Add google_name column
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_name VARCHAR(255)
        `).catch(e => {
            if (!e.message.includes('already exists')) throw e;
            console.log('  ℹ️  google_name column already exists');
        });

        // Add google_picture column
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_picture VARCHAR(500)
        `).catch(e => {
            if (!e.message.includes('already exists')) throw e;
            console.log('  ℹ️  google_picture column already exists');
        });

        // Add created_at if it doesn't exist
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `).catch(e => {
            if (!e.message.includes('already exists')) throw e;
            console.log('  ℹ️  created_at column already exists');
        });

        console.log('✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
        console.log('2. Create a new project or select existing one');
        console.log('3. Enable Google+ API');
        console.log('4. Create OAuth 2.0 credentials (Web application)');
        console.log('5. Set authorized redirect URI:');
        console.log('   http://localhost:3011/api/auth/google/callback (for dev)');
        console.log('   https://yourdomain.com/api/auth/google/callback (for production)');
        console.log('6. Copy Client ID and Client Secret');
        console.log('7. Add to .env file:');
        console.log('   GOOGLE_CLIENT_ID=your_client_id');
        console.log('   GOOGLE_CLIENT_SECRET=your_client_secret');
        console.log('   NEXTAUTH_URL=http://localhost:3011 (for dev)');

    } finally {
        connection.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
EOF

# Run the migration script
node /tmp/migrate-google-oauth.js

rm /tmp/migrate-google-oauth.js

echo "✨ All done!"
