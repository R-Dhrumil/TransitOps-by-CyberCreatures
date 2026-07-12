'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { vehicleSchema, vehicleUpdateSchema } = require('../validators/schemas');

// GET /api/vehicles  — list with optional filters
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { type, status, region } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (type) { conditions.push(`type = $${idx++}`); values.push(type); }
  if (status) { conditions.push(`status = $${idx++}`); values.push(status); }
  if (region) { conditions.push(`region = $${idx++}`); values.push(region); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM vehicles ${where} ORDER BY created_at DESC`,
    values
  );
  res.json({ success: true, data: rows, count: rows.length });
}));

// GET /api/vehicles/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
  if (!rows.length) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: rows[0] });
}));

// POST /api/vehicles — fleet_manager only
router.post('/', authenticate, requireRole('fleet_manager'), validate(vehicleSchema), asyncHandler(async (req, res) => {
  const { registration_number, name_model, type, max_load_capacity, acquisition_cost, odometer, region } = req.validatedBody;
  const { rows } = await pool.query(
    `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, acquisition_cost, odometer, region)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [registration_number, name_model, type, max_load_capacity, acquisition_cost, odometer ?? 0, region ?? null]
  );
  res.status(201).json({ success: true, data: rows[0] });
}));

// PATCH /api/vehicles/:id — fleet_manager only
router.patch('/:id', authenticate, requireRole('fleet_manager'), validate(vehicleUpdateSchema), asyncHandler(async (req, res) => {
  const allowed = ['name_model', 'type', 'max_load_capacity', 'acquisition_cost', 'odometer', 'region', 'status'];
  const updates = Object.entries(req.validatedBody).filter(([k]) => allowed.includes(k));
  if (!updates.length) throw new AppError('No valid fields to update.', 400);

  const setClauses = updates.map(([k], i) => `${k} = $${i + 1}`);
  const values = [...updates.map(([, v]) => v), req.params.id];

  const { rows } = await pool.query(
    `UPDATE vehicles SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!rows.length) throw new AppError('Vehicle not found.', 404);
  res.json({ success: true, data: rows[0] });
}));

// DELETE /api/vehicles/:id — fleet_manager only (soft retire)
router.delete('/:id', authenticate, requireRole('fleet_manager'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE vehicles SET status = 'Retired' WHERE id = $1 AND status != 'Retired' RETURNING id`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Vehicle not found or already retired.', 404);
  res.json({ success: true, message: 'Vehicle retired successfully.' });
}));

module.exports = router;
