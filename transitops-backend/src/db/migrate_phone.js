'use strict';
require('dotenv').config();
const pool = require('./pool');

const migrate = async () => {
  console.log('[Migration] Adding phone column to users table...');
  
  // 1. Add column
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
  `);
  console.log('✅ Phone column added or already exists.');

  // 2. Set phone number for the seeded driver user
  await pool.query(`
    UPDATE users 
    SET phone = '9876543210' 
    WHERE email = 'driver@transitops.dev';
  `);
  console.log('✅ Seeded driver user (driver@transitops.dev) updated with phone: 9876543210');

  console.log('[Migration] ✅ Migration complete.');
  await pool.end();
};

migrate().catch(err => {
  console.error('[Migration] ❌ Migration failed:', err.message);
  process.exit(1);
});
