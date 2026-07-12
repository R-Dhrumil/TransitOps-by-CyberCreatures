'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { maintenanceSchema } = require('../validators/schemas');
const { notifyRole } = require('../services/notification.service');
const { sendMaintenanceAlertEmail } = require('../utils/email');

// GET /api/maintenance
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT ml.*, v.registration_number, v.name_model
    FROM maintenance_logs ml
    JOIN vehicles v ON ml.vehicle_id = v.id
    ORDER BY ml.created_at DESC
  `);
  res.json({ success: true, data: rows, count: rows.length });
}));

// POST /api/maintenance — fleet_manager only, atomically sets vehicle → In Shop
router.post('/', authenticate, requireRole('fleet_manager'), validate(maintenanceSchema), asyncHandler(async (req, res) => {
  const { vehicle_id, description, cost } = req.validatedBody;

  const result = await withTransaction(async (client) => {
    const { rows: vRows } = await client.query(
      'SELECT status FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id]
    );
    if (!vRows.length) throw new AppError('Vehicle not found.', 404);
    if (vRows[0].status === 'Retired') throw new AppError('Cannot create maintenance for a retired vehicle.', 409);
    if (vRows[0].status === 'On Trip') throw new AppError('Vehicle is currently on a trip.', 409);

    const { rows: logRows } = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost)
       VALUES ($1, $2, $3) RETURNING *`,
      [vehicle_id, description, cost ?? 0]
    );
    await client.query(`UPDATE vehicles SET status = 'In Shop' WHERE id = $1`, [vehicle_id]);
    return logRows[0];
  });

  await notifyRole('fleet_manager', 'Vehicle in Shop', `A vehicle has been placed in the shop for maintenance.`, 'warning', '/maintenance');

  // Query vehicle details and dispatch emails asynchronously
  pool.query('SELECT registration_number, name_model FROM vehicles WHERE id = $1', [result.vehicle_id])
    .then(({ rows: vRows }) => {
      if (vRows.length) {
        const vehicle = vRows[0];
        return pool.query("SELECT email FROM users WHERE role IN ('fleet_manager', 'dispatcher')")
          .then(({ rows: userRows }) => {
            const emails = userRows.map(u => u.email).filter(Boolean);
            if (emails.length) {
              return sendMaintenanceAlertEmail({
                recipients: emails,
                vehicleReg: vehicle.registration_number,
                vehicleModel: vehicle.name_model,
                status: 'Open',
                description,
                cost: cost ?? 0
              });
            }
          });
      }
    })
    .catch(err => console.error('[Email Maintenance] Failed to send maintenance email:', err));

  res.status(201).json({ success: true, data: result });
}));

// PATCH /api/maintenance/:id/close — close record, vehicle → Available
router.patch('/:id/close', authenticate, requireRole('fleet_manager'), asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const { rows: logRows } = await client.query(
      'SELECT * FROM maintenance_logs WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (!logRows.length) throw new AppError('Maintenance record not found.', 404);
    const log = logRows[0];
    if (log.status === 'Closed') throw new AppError('Maintenance record is already closed.', 409);

    await client.query(
      `UPDATE maintenance_logs SET status = 'Closed', closed_at = NOW() WHERE id = $1`, [log.id]
    );

    // Only restore to Available if not Retired
    const { rows: vRows } = await client.query('SELECT status FROM vehicles WHERE id = $1', [log.vehicle_id]);
    if (vRows.length && vRows[0].status !== 'Retired') {
      await client.query(`UPDATE vehicles SET status = 'Available' WHERE id = $1`, [log.vehicle_id]);
    }

    const { rows: updated } = await client.query('SELECT * FROM maintenance_logs WHERE id = $1', [log.id]);
    return updated[0];
  });

  await notifyRole('fleet_manager', 'Maintenance Complete', `A maintenance log has been closed.`, 'success', '/maintenance');

  // Query vehicle details and dispatch emails asynchronously
  pool.query('SELECT registration_number, name_model FROM vehicles WHERE id = $1', [result.vehicle_id])
    .then(({ rows: vRows }) => {
      if (vRows.length) {
        const vehicle = vRows[0];
        return pool.query("SELECT email FROM users WHERE role IN ('fleet_manager', 'dispatcher')")
          .then(({ rows: userRows }) => {
            const emails = userRows.map(u => u.email).filter(Boolean);
            if (emails.length) {
              return sendMaintenanceAlertEmail({
                recipients: emails,
                vehicleReg: vehicle.registration_number,
                vehicleModel: vehicle.name_model,
                status: 'Closed',
                description: result.description,
                cost: result.cost
              });
            }
          });
      }
    })
    .catch(err => console.error('[Email Maintenance] Failed to send maintenance email:', err));

  res.json({ success: true, data: result });
}));

module.exports = router;
