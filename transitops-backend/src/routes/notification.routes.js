'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
// Fetch all notifications for the logged-in user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [req.user.id]
  );
  
  const unreadCount = rows.filter((n) => !n.is_read).length;

  res.json({ success: true, data: rows, unreadCount });
}));

// PATCH /api/notifications/:id/read
// Mark a specific notification as read
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
  }

  res.json({ success: true, data: rows[0] });
}));

// PATCH /api/notifications/read-all
// Mark all notifications as read for the logged-in user
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE user_id = $1 AND is_read = FALSE`,
    [req.user.id]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
}));

module.exports = router;
