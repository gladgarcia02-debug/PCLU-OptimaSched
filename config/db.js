'use strict';

/**
 * PostgreSQL connection pool.
 *
 * Every model imports `query` / `getClient` from here so the rest of the
 * app never touches the `pg` driver directly. This keeps data access in
 * one place and makes it trivial to swap the driver or add logging later.
 */

const { Pool } = require('pg');
require('dotenv').config();

const useConnectionString = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.PGSSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'pclu_optimasched',
      }
);

pool.on('error', (err) => {
  // Idle client errors should never crash the whole process.
  console.error('[db] Unexpected idle client error:', err.message);
});

/**
 * Run a parameterised query. Always prefer parameters ($1, $2 …) over
 * string interpolation to stay safe from SQL injection.
 *
 * @param {string} text  SQL text
 * @param {Array}  params  bound parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    const ms = Date.now() - start;
    console.log(`[db] ${ms}ms  ${text.split('\n')[0].trim().slice(0, 60)}`);
  }
  return result;
}

/**
 * Grab a dedicated client for a transaction. Caller MUST release it.
 * @returns {Promise<import('pg').PoolClient>}
 */
function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
