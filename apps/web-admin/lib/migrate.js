/*
  Simple migration runner for Mosque Digital Clock (MySQL).

  Usage:
    cd apps/web-admin
    DATABASE_URL=... node lib/migrate.js

  Notes:
  - Uses table `schema_migrations` to track applied migrations.
  - Runs *.sql files in /migrations in lexical order.
*/

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing DATABASE_URL env var');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log('[migrate] No migrations found.');
    return;
  }

  const connection = await mysql.createConnection({ uri: dbUrl, multipleStatements: true });
  try {
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );

    const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRows.map((r) => r.filename));

    for (const filename of files) {
      if (applied.has(filename)) {
        console.log(`[migrate] Skipping ${filename} (already applied)`);
        continue;
      }

      const fullPath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`[migrate] Applying ${filename} ...`);
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
        await connection.commit();
        console.log(`[migrate] Applied ${filename}`);
      } catch (err) {
        await connection.rollback();
        console.error(`[migrate] Failed ${filename}:`, err.message);
        throw err;
      }
    }

    console.log('[migrate] Done.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
