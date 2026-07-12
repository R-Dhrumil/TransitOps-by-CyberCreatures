'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { validate } = require('../middleware/validate');
const { incidentSchema } = require('../validators/schemas');
const { notifyAllExceptRole } = require('../services/notification.service');

// GET /api/public/active-trip — Find active trip by vehicle registration number
router.get('/active-trip', asyncHandler(async (req, res) => {
  const { registration_number } = req.query;
  if (!registration_number) {
    throw new AppError('Registration number is required.', 400);
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.source, t.destination, d.name AS driver_name, v.registration_number
     FROM trips t
     JOIN vehicles v ON t.vehicle_id = v.id
     JOIN drivers d ON t.driver_id = d.id
     WHERE UPPER(v.registration_number) = UPPER($1) AND t.status = 'Dispatched'
     LIMIT 1`,
    [registration_number.trim()]
  );

  if (!rows.length) {
    throw new AppError('No active trip found for this vehicle. Ensure the vehicle registration number is correct and the trip is dispatched.', 404);
  }

  res.json({ success: true, data: rows[0] });
}));

// POST /api/public/trips/:id/incidents — Log incident publicly (without auth)
router.post('/trips/:id/incidents', validate(incidentSchema), asyncHandler(async (req, res) => {
  const { incident_type, location, photo_url, comments } = req.validatedBody;
  const trip_id = req.params.id;

  // Verify trip exists
  const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [trip_id]);
  if (!tripCheck.rows.length) {
    throw new AppError('Trip not found.', 404);
  }

  const { rows } = await pool.query(
    `INSERT INTO trip_incidents (trip_id, reported_by, incident_type, location, photo_url, comments)
     VALUES ($1, NULL, $2, $3, $4, $5) RETURNING *`,
    [trip_id, incident_type, location ?? null, photo_url ?? null, comments ?? null]
  );

  await notifyAllExceptRole('driver', 'Public Incident Reported', `A public report for a ${incident_type} incident was submitted for Trip #${trip_id}.`, 'warning', `/trips`);

  res.status(201).json({ success: true, data: rows[0] });
}));

module.exports = router;
