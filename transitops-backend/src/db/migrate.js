'use strict';
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('./pool');

/**
 * Runs schema.sql once to create all tables and enums.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
const migrate = async () => {
  console.log('[Migrate] Starting database migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('[Migrate] ✅ Schema applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch((err) => {
  console.error('[Migrate] ❌ Migration failed:', err.message);
  process.exit(1);
});
