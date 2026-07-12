'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { driverSchema, driverUpdateSchema } = require('../validators/schemas');

// GET /api/drivers
router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Automatically suspend any drivers whose license has expired
  await pool.query(`UPDATE drivers SET status = 'Suspended' WHERE license_expiry_date < CURRENT_DATE AND status = 'Available'`);

  const { status } = req.query;
  const values = [];
  let whereClauses = [];

  if (status) {
    values.push(status);
    whereClauses.push(`status = $${values.length}`);
  }

  // Isolate drivers so they only see their own profile
  if (req.user.role === 'driver') {
    values.push(req.user.phone || 'UNMATCHABLE_PHONE');
    whereClauses.push(`contact_number = $${values.length}`);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
  
  const isExpired = new Date(license_expiry_date) < new Date();
  const status = isExpired ? 'Suspended' : 'Available';

  const { rows } = await pool.query(
    `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, license_number, license_category, license_expiry_date, contact_number ?? null, safety_score ?? 100, status]
  );

  // Automatically create a user account for the driver to log in
  try {
    const passwordHash = await bcrypt.hash(license_number, 12);
    const fakeEmail = `${license_number.toLowerCase()}@transitops.local`;
    await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'driver')
       ON CONFLICT DO NOTHING`,
      [fakeEmail, contact_number || license_number, passwordHash, name]
    );
  } catch (e) {
    console.error('Failed to auto-create user for driver:', e.message);
  }

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

  let driver = rows[0];
  if (new Date(driver.license_expiry_date) < new Date() && driver.status === 'Available') {
    const res2 = await pool.query(`UPDATE drivers SET status = 'Suspended' WHERE id = $1 RETURNING *`, [driver.id]);
    driver = res2.rows[0];
  }

  res.json({ success: true, data: driver });
}));

module.exports = router;
