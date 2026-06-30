'use strict';

/**
 * Database bootstrap.
 *
 *   npm run db:init     → create tables (schema.sql) + default admin user
 *   npm run db:seed     → the above PLUS sample reference data (seed.sql)
 *
 * The default admin password is hashed here (not in SQL) because hashing
 * must happen in Node with bcrypt.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/db');

const WITH_SEED = process.argv.includes('--seed');

const DEFAULT_ADMIN = {
  full_name: 'PCLU Administrator',
  email: 'admin@pclu.edu.ph',
  password: 'OptimaSched@2025',
  role: 'admin',
};

async function runSqlFile(file) {
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  await query(sql);
  console.log(`  ✓ applied ${file}`);
}

async function createAdmin() {
  const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
  await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [DEFAULT_ADMIN.full_name, DEFAULT_ADMIN.email, hash, DEFAULT_ADMIN.role]
  );
  console.log(`  ✓ default admin ensured  (${DEFAULT_ADMIN.email})`);
}

(async () => {
  try {
    console.log('› Initialising PCLU OptimaSched database …');
    await runSqlFile('schema.sql');
    await createAdmin();
    if (WITH_SEED) {
      await runSqlFile('seed.sql');
    }
    console.log('\nDone.');
    if (WITH_SEED) {
      console.log('Login with:');
      console.log(`  email    ${DEFAULT_ADMIN.email}`);
      console.log(`  password ${DEFAULT_ADMIN.password}`);
    }
  } catch (err) {
    console.error('\n✗ Database init failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
