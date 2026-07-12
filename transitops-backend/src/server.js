'use strict';
require('dotenv').config();

const app = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 5000;

// Graceful shutdown helper
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Verify DB connectivity before accepting traffic
pool.connect()
  .then(async (client) => {
    client.release();
    console.log('[DB] PostgreSQL connected successfully');
    
    // Auto-migrate newly added tables if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        message     TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'info',
        is_read     BOOLEAN DEFAULT FALSE,
        link        TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `).catch(err => console.error('[DB] Auto-migration failed:', err.message));

    app.listen(PORT, () => {
      console.log(`[Server] TransitOps API running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });
