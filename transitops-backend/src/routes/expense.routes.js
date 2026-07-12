'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { expenseSchema } = require('../validators/schemas');

// GET /api/expenses — financial_analyst + fleet_manager
router.get('/', authenticate, requireRole('financial_analyst', 'fleet_manager'), asyncHandler(async (req, res) => {
  const { vehicle_id, category } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (vehicle_id) { conditions.push(`e.vehicle_id = $${idx++}`); values.push(vehicle_id); }
  if (category) { conditions.push(`e.category = $${idx++}`); values.push(category); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`
    SELECT e.*, v.registration_number
    FROM expenses e
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    ${where}
    ORDER BY e.expense_date DESC, e.created_at DESC
  `, values);

  res.json({ success: true, data: rows, count: rows.length });
}));

// POST /api/expenses — financial_analyst only
router.post('/', authenticate, requireRole('financial_analyst'), validate(expenseSchema), asyncHandler(async (req, res) => {
  const { vehicle_id, category, amount, expense_date, notes } = req.validatedBody;
  const { rows } = await pool.query(
    `INSERT INTO expenses (vehicle_id, category, amount, expense_date, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [vehicle_id ?? null, category, amount, expense_date ?? new Date().toISOString().slice(0, 10), notes ?? null]
  );
  res.status(201).json({ success: true, data: rows[0] });
}));

module.exports = router;
