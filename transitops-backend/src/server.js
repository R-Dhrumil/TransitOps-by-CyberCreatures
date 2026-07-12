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
  .then((client) => {
    client.release();
    console.log('[DB] PostgreSQL connected successfully');
    app.listen(PORT, () => {
      console.log(`[Server] TransitOps API running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });
