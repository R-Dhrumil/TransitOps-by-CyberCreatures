'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserRoleSchema } = require('../validators/schemas');

// All routes require fleet_manager role
router.use(authenticate, requireRole('fleet_manager'));

// ─────────────────────────────────────────────────────────────
// POST /api/users/create
// Fleet manager creates a new team member account
// ─────────────────────────────────────────────────────────────
router.post('/create', validate(createUserSchema), asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.validatedBody;

  // Check for duplicate email
  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 409, 'DUPLICATE_EMAIL');
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, role, created_at`,
    [email, password_hash, full_name, role]
  );

  res.status(201).json({
    success: true,
    message: `Account for ${full_name} created successfully.`,
    data: rows[0],
  });
}));

// ─────────────────────────────────────────────────────────────
// GET /api/users
// Fleet manager lists all users (excluding themselves)
// ─────────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, role, created_at
     FROM users
     ORDER BY
       CASE role
         WHEN 'fleet_manager'     THEN 1
         WHEN 'dispatcher'        THEN 2
         WHEN 'driver'            THEN 3
         WHEN 'safety_officer'    THEN 4
         WHEN 'financial_analyst' THEN 5
         ELSE 6
       END,
       full_name ASC`
  );

  res.json({ success: true, data: rows });
}));

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/:id/role
// Fleet manager updates a user's role
// ─────────────────────────────────────────────────────────────
router.patch('/:id/role', validate(updateUserRoleSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.validatedBody;

  // Prevent fleet manager from changing their own role
  if (id === req.user.id) {
    throw new AppError('You cannot change your own role.', 400, 'SELF_ROLE_CHANGE');
  }

  // Check that target user exists and is not a fleet_manager
  const { rows: target } = await pool.query(
    'SELECT id, full_name, role FROM users WHERE id = $1',
    [id]
  );
  if (target.length === 0) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  if (target[0].role === 'fleet_manager') {
    throw new AppError('Cannot change the role of another fleet manager.', 403, 'FORBIDDEN');
  }

  const { rows } = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, email, full_name, role`,
    [role, id]
  );

  res.json({
    success: true,
    message: `Role updated to ${role} for ${rows[0].full_name}.`,
    data: rows[0],
  });
}));

// ─────────────────────────────────────────────────────────────
// DELETE /api/users/:id
// Fleet manager removes a team member
// ─────────────────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    throw new AppError('You cannot delete your own account.', 400, 'SELF_DELETE');
  }

  // Check user exists and is not a fleet_manager
  const { rows: target } = await pool.query(
    'SELECT id, full_name, role FROM users WHERE id = $1',
    [id]
  );
  if (target.length === 0) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  if (target[0].role === 'fleet_manager') {
    throw new AppError('Cannot remove another fleet manager.', 403, 'FORBIDDEN');
  }

  await pool.query('DELETE FROM users WHERE id = $1', [id]);

  res.json({
    success: true,
    message: `${target[0].full_name} has been removed from the fleet.`,
  });
}));

module.exports = router;
