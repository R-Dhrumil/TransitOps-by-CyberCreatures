'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/kpis
router.get('/kpis', authenticate, asyncHandler(async (req, res) => {
  const [
    vehicleStats,
    driverStats,
    tripStats,
    utilizationData,
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Available') AS available,
        COUNT(*) FILTER (WHERE status = 'On Trip')   AS on_trip,
        COUNT(*) FILTER (WHERE status = 'In Shop')   AS in_maintenance,
        COUNT(*) FILTER (WHERE status = 'Retired')   AS retired,
        COUNT(*)                                      AS total
      FROM vehicles
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Available') AS available,
        COUNT(*) FILTER (WHERE status = 'On Trip')   AS on_trip,
        COUNT(*) FILTER (WHERE status = 'Off Duty')  AS off_duty,
        COUNT(*) FILTER (WHERE status = 'Suspended') AS suspended,
        COUNT(*)                                      AS total
      FROM drivers
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Dispatched') AS active,
        COUNT(*) FILTER (WHERE status = 'Draft')      AS pending,
        COUNT(*) FILTER (WHERE status = 'Completed')  AS completed,
        COUNT(*) FILTER (WHERE status = 'Cancelled')  AS cancelled,
        COUNT(*)                                       AS total
      FROM trips
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('On Trip', 'In Shop')) AS busy_vehicles,
        COUNT(*) AS total_vehicles
      FROM vehicles WHERE status != 'Retired'
    `),
  ]);

  const vStats = vehicleStats.rows[0];
  const dStats = driverStats.rows[0];
  const tStats = tripStats.rows[0];
  const uData = utilizationData.rows[0];

  const fleetUtilization = uData.total_vehicles > 0
    ? Math.round((uData.busy_vehicles / uData.total_vehicles) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      vehicles: vStats,
      drivers: dStats,
      trips: tStats,
      fleet_utilization_percent: fleetUtilization,
    },
  });
}));

module.exports = router;
