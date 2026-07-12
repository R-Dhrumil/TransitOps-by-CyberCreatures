'use strict';

const pool = require('../db/pool');

/**
 * Creates a notification for a specific user
 * @param {string} userId - UUID of the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {string} link - Optional URL to redirect to
 */
const notifyUser = async (userId, title, message, type = 'info', link = null) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, message, type, link]
    );
    return rows[0];
  } catch (error) {
    console.error('Failed to create notification for user:', userId, error);
    return null;
  }
};

/**
 * Creates a notification for all users with a specific role
 * @param {string} role - e.g., 'fleet_manager', 'financial_analyst'
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {string} link - Optional URL to redirect to
 */
const notifyRole = async (role, title, message, type = 'info', link = null) => {
  try {
    const { rows: users } = await pool.query('SELECT id FROM users WHERE role = $1', [role]);
    if (!users.length) return [];

    const values = users.map((u) => `('${u.id}', $1, $2, $3, $4)`).join(', ');
    const query = `
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ${values} RETURNING *
    `;
    const { rows } = await pool.query(query, [title, message, type, link]);
    return rows;
  } catch (error) {
    console.error('Failed to create notifications for role:', role, error);
    return [];
  }
};

module.exports = {
  notifyUser,
  notifyRole
};
