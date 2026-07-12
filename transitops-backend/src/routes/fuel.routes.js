'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { fuelLogSchema } = require('../validators/schemas');

// GET /api/fuel-logs
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { vehicle_id } = req.query;
  const values = [];
  const where = vehicle_id ? 'WHERE fl.vehicle_id = $1' : '';
  if (vehicle_id) values.push(vehicle_id);

  const { rows } = await pool.query(`
    SELECT fl.*, v.registration_number, v.name_model
    FROM fuel_logs fl
    JOIN vehicles v ON fl.vehicle_id = v.id
    ${where}
    ORDER BY fl.log_date DESC, fl.created_at DESC
  `, values);

  res.json({ success: true, data: rows, count: rows.length });
}));

// POST /api/fuel-logs — driver or fleet_manager
router.post('/', authenticate, requireRole('driver', 'fleet_manager'), validate(fuelLogSchema), asyncHandler(async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, log_date } = req.validatedBody;
  const { rows } = await pool.query(
    `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vehicle_id, trip_id ?? null, liters, cost, log_date ?? new Date().toISOString().slice(0, 10)]
  );
  res.status(201).json({ success: true, data: rows[0] });
}));

module.exports = router;
