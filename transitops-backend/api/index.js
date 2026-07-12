'use strict';
/**
 * Vercel Serverless Function entry point.
 * Exports the Express app — no app.listen() here.
 * The vercel.json rewrite routes all /api/* requests here.
 */
require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/db/pool');

// Auto-migrate newly added tables if missing (Vercel cold start)
pool.query(`
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

module.exports = app;
