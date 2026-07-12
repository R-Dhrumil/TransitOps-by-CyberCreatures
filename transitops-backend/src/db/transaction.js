'use strict';
const pool = require('./pool');

/**
 * withTransaction(callback)
 * Wraps a sequence of DB operations in a transaction.
 * Acquires a dedicated client, runs BEGIN, calls callback(client),
 * COMMITs on success or ROLLBACKs on error — then releases the client.
 *
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     await client.query('SELECT ... FOR UPDATE', [id]);
 *     await client.query('UPDATE ...', [...]);
 *     return someValue;
 *   });
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { withTransaction };
