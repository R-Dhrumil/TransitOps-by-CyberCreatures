'use strict';
const { Pool } = require('pg');

/**
 * Single pg.Pool instance — created once at module scope.
 * Vercel reuses warm containers, so warm invocations share this pool
 * instead of opening a new connection on every request.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Railway managed Postgres requires this
    : false,
  max: 5,                             // Keep small — Railway free tier has connection limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors globally so they don't crash the process silently
pool.on('error', (err) => {
  console.error('[Pool] Unexpected error on idle client:', err.message);
});

module.exports = pool;
