'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { driverSchema, driverUpdateSchema } = require('../validators/schemas');

// GET /api/drivers
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const values = [];
  const where = status ? `WHERE status = $1` : '';
  if (status) values.push(status);

  const { rows } = await pool.query(
    `SELECT *, license_expiry_date < CURRENT_DATE AS license_expired
     FROM drivers ${where}
     ORDER BY created_at DESC`,
    values
  );
  res.json({ success: true, data: rows, count: rows.length });
}));

// GET /api/drivers/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT *, license_expiry_date < CURRENT_DATE AS license_expired FROM drivers WHERE id = $1`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Driver not found.', 404);
  res.json({ success: true, data: rows[0] });
}));

// POST /api/drivers — safety_officer, fleet_manager, dispatcher
router.post('/', authenticate, requireRole('safety_officer', 'fleet_manager', 'dispatcher'), validate(driverSchema), asyncHandler(async (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score } = req.validatedBody;
  const { rows } = await pool.query(
    `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, license_number, license_category, license_expiry_date, contact_number ?? null, safety_score ?? 100]
  );
  res.status(201).json({ success: true, data: rows[0] });
}));

// PATCH /api/drivers/:id — safety_officer, fleet_manager, dispatcher
router.patch('/:id', authenticate, requireRole('safety_officer', 'fleet_manager', 'dispatcher'), validate(driverUpdateSchema), asyncHandler(async (req, res) => {
  const allowed = ['name', 'license_number', 'license_category', 'license_expiry_date', 'contact_number', 'safety_score', 'status'];
  const updates = Object.entries(req.validatedBody).filter(([k]) => allowed.includes(k));
  if (!updates.length) throw new AppError('No valid fields to update.', 400);

  const setClauses = updates.map(([k], i) => `${k} = $${i + 1}`);
  const values = [...updates.map(([, v]) => v), req.params.id];

  const { rows } = await pool.query(
    `UPDATE drivers SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) throw new AppError('Driver not found.', 404);
  res.json({ success: true, data: rows[0] });
}));

module.exports = router;
