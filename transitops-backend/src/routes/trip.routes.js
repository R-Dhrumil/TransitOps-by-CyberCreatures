'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { tripSchema, tripCompleteSchema, incidentSchema } = require('../validators/schemas');
const { notifyRole, notifyAllExceptRole } = require('../services/notification.service');

// GET /api/trips
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const values = [];
  const where = status ? `WHERE t.status = $1` : '';
  if (status) values.push(status);

  const { rows } = await pool.query(`
    SELECT t.*,
           v.registration_number, v.name_model,
           d.name AS driver_name,
           u.full_name AS created_by_name,
           (SELECT COUNT(*)::int FROM trip_incidents WHERE trip_id = t.id) AS incident_count
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers  d ON t.driver_id  = d.id
    LEFT JOIN users    u ON t.created_by = u.id
    ${where}
    ORDER BY t.created_at DESC
  `, values);

  res.json({ success: true, data: rows, count: rows.length });
}));

// GET /api/trips/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT t.*,
           v.registration_number, v.name_model, v.max_load_capacity,
           d.name AS driver_name, d.license_number,
           u.full_name AS created_by_name,
           (SELECT COUNT(*)::int FROM trip_incidents WHERE trip_id = t.id) AS incident_count
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers  d ON t.driver_id  = d.id
    LEFT JOIN users    u ON t.created_by = u.id
    WHERE t.id = $1
  `, [req.params.id]);

  if (!rows.length) throw new AppError('Trip not found.', 404);
  res.json({ success: true, data: rows[0] });
}));

// POST /api/trips — driver only (creates as Draft)
router.post('/', authenticate, requireRole('driver', 'fleet_manager', 'dispatcher'), validate(tripSchema), asyncHandler(async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.validatedBody;

  // Validate cargo <= vehicle capacity
  const { rows: vRows } = await pool.query(
    'SELECT max_load_capacity, status FROM vehicles WHERE id = $1',
    [vehicle_id]
  );
  if (!vRows.length) throw new AppError('Vehicle not found.', 404);
  if (vRows[0].status !== 'Available') throw new AppError('Vehicle is not available.', 409, 'VEHICLE_UNAVAILABLE');
  if (cargo_weight > vRows[0].max_load_capacity) {
    throw new AppError(`Cargo weight (${cargo_weight}kg) exceeds vehicle capacity (${vRows[0].max_load_capacity}kg).`, 422, 'OVERWEIGHT');
  }

  // Validate driver
  const { rows: dRows } = await pool.query(
    'SELECT status, license_expiry_date FROM drivers WHERE id = $1',
    [driver_id]
  );
  if (!dRows.length) throw new AppError('Driver not found.', 404);
  if (dRows[0].status !== 'Available') throw new AppError('Driver is not available.', 409, 'DRIVER_UNAVAILABLE');
  if (new Date(dRows[0].license_expiry_date) < new Date()) {
    throw new AppError('Driver license has expired.', 409, 'LICENSE_EXPIRED');
  }

  const { rows } = await pool.query(
    `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, req.user.id]
  );

  await notifyRole('fleet_manager', 'New Trip Created', `A new trip from ${source} to ${destination} was drafted.`, 'info', '/trips');

  res.status(201).json({ success: true, data: rows[0] });
}));

// PATCH /api/trips/:id/dispatch — Draft → Dispatched (atomic)
router.patch('/:id/dispatch', authenticate, requireRole('driver', 'fleet_manager', 'dispatcher'), asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    // Row-lock to prevent race conditions
    const { rows: tripRows } = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!tripRows.length) throw new AppError('Trip not found.', 404);
    const trip = tripRows[0];
    if (trip.status !== 'Draft') throw new AppError(`Cannot dispatch a trip in '${trip.status}' status.`, 409, 'INVALID_STATUS_TRANSITION');

    // Re-check vehicle
    const { rows: vRows } = await client.query(
      'SELECT status FROM vehicles WHERE id = $1 FOR UPDATE',
      [trip.vehicle_id]
    );
    if (vRows[0].status !== 'Available') throw new AppError('Vehicle is no longer available.', 409, 'VEHICLE_UNAVAILABLE');

    // Re-check driver
    const { rows: dRows } = await client.query(
      'SELECT status, license_expiry_date FROM drivers WHERE id = $1 FOR UPDATE',
      [trip.driver_id]
    );
    if (dRows[0].status !== 'Available') throw new AppError('Driver is no longer available.', 409, 'DRIVER_UNAVAILABLE');
    if (new Date(dRows[0].license_expiry_date) < new Date()) throw new AppError('Driver license has expired.', 409, 'LICENSE_EXPIRED');

    // Apply state changes atomically
    await client.query(`UPDATE trips SET status = 'Dispatched', dispatched_at = NOW() WHERE id = $1`, [trip.id]);
    await client.query(`UPDATE vehicles SET status = 'On Trip' WHERE id = $1`, [trip.vehicle_id]);
    await client.query(`UPDATE drivers SET status = 'On Trip' WHERE id = $1`, [trip.driver_id]);

    const { rows } = await client.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    return rows[0];
  });

  await notifyRole('fleet_manager', 'Trip Dispatched', `Trip to ${result.destination} has been dispatched.`, 'success', '/trips');

  res.json({ success: true, data: result });
}));

// PATCH /api/trips/:id/complete — Dispatched → Completed (atomic)
router.patch('/:id/complete', authenticate, requireRole('driver', 'fleet_manager', 'dispatcher'), validate(tripCompleteSchema), asyncHandler(async (req, res) => {
  const { final_odometer, fuel_consumed, fuel_cost } = req.validatedBody;

  const result = await withTransaction(async (client) => {
    const { rows: tripRows } = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (!tripRows.length) throw new AppError('Trip not found.', 404);
    const trip = tripRows[0];
    if (trip.status !== 'Dispatched') throw new AppError(`Cannot complete a trip in '${trip.status}' status.`, 409, 'INVALID_STATUS_TRANSITION');

    // Update trip
    await client.query(
      `UPDATE trips SET status = 'Completed', completed_at = NOW(), final_odometer = $1, fuel_consumed = $2 WHERE id = $3`,
      [final_odometer, fuel_consumed ?? null, trip.id]
    );

    // Update vehicle odometer and status
    await client.query(
      `UPDATE vehicles SET status = 'Available', odometer = $1 WHERE id = $2`,
      [final_odometer, trip.vehicle_id]
    );

    // Restore driver
    await client.query(`UPDATE drivers SET status = 'Available' WHERE id = $1`, [trip.driver_id]);

    // Log fuel if provided
    if (fuel_consumed && fuel_cost) {
      await client.query(
        `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost) VALUES ($1, $2, $3, $4)`,
        [trip.vehicle_id, trip.id, fuel_consumed, fuel_cost]
      );
    }

    const { rows } = await client.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    return rows[0];
  });

  await notifyRole('fleet_manager', 'Trip Completed', `Trip to ${result.destination} has been completed.`, 'success', '/trips');

  res.json({ success: true, data: result });
}));

// PATCH /api/trips/:id/cancel — Dispatched → Cancelled (atomic)
router.patch('/:id/cancel', authenticate, requireRole('driver', 'fleet_manager', 'dispatcher'), asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const { rows: tripRows } = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (!tripRows.length) throw new AppError('Trip not found.', 404);
    const trip = tripRows[0];
    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      throw new AppError(`Cannot cancel a trip in '${trip.status}' status.`, 409, 'INVALID_STATUS_TRANSITION');
    }

    await client.query(`UPDATE trips SET status = 'Cancelled', cancelled_at = NOW() WHERE id = $1`, [trip.id]);

    if (trip.status === 'Dispatched') {
      await client.query(`UPDATE vehicles SET status = 'Available' WHERE id = $1`, [trip.vehicle_id]);
      await client.query(`UPDATE drivers SET status = 'Available' WHERE id = $1`, [trip.driver_id]);
    }

    const { rows } = await client.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    return rows[0];
  });

  res.json({ success: true, data: result });
}));

// POST /api/trips/:id/incidents — Log a new incident
router.post('/:id/incidents', authenticate, validate(incidentSchema), asyncHandler(async (req, res) => {
  const { incident_type, location, photo_url, comments } = req.validatedBody;
  
  // Verify trip exists
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
  if (!tripRows.length) throw new AppError('Trip not found.', 404);

  const { rows } = await pool.query(`
    INSERT INTO trip_incidents (trip_id, reported_by, incident_type, location, photo_url, comments)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.params.id, req.user.id, incident_type, location, photo_url, comments]);

  await notifyAllExceptRole('driver', 'New Incident Reported', `A new ${incident_type} incident was reported on Trip #${req.params.id}.`, 'warning', `/trips`);

  res.status(201).json({ success: true, data: rows[0] });
}));

// GET /api/trips/:id/incidents — Get all incidents for a specific trip
router.get('/:id/incidents', authenticate, asyncHandler(async (req, res) => {
  // Verify trip exists
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
  if (!tripRows.length) throw new AppError('Trip not found.', 404);

  const { rows } = await pool.query(`
    SELECT ti.*, u.full_name AS reporter_name
    FROM trip_incidents ti
    LEFT JOIN users u ON ti.reported_by = u.id
    WHERE ti.trip_id = $1
    ORDER BY ti.created_at DESC
  `, [req.params.id]);

  res.json({ success: true, data: rows });
}));

module.exports = router;
