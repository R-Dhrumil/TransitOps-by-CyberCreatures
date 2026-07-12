'use strict';
require('dotenv').config();
const pool = require('./pool');

const migrate = async () => {
  console.log('[Migration] Adding "Retired" to driver_status enum...');
  
  await pool.query(`
    ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'Retired';
  `);
  console.log('✅ "Retired" status added or already exists in driver_status enum.');

  console.log('[Migration] ✅ Migration complete.');
  await pool.end();
};

migrate().catch(err => {
  console.error('[Migration] ❌ Migration failed:', err.message);
  process.exit(1);
});
