'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

// GET /api/reports/fuel-efficiency — distance per liter per vehicle
router.get('/fuel-efficiency', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      v.id,
      v.registration_number,
      v.name_model,
      v.type,
      COALESCE(SUM(t.planned_distance), 0) AS total_distance_km,
      COALESCE(SUM(fl.liters), 0) AS total_fuel_liters,
      CASE
        WHEN COALESCE(SUM(fl.liters), 0) > 0
        THEN ROUND((SUM(t.planned_distance) / SUM(fl.liters))::numeric, 2)
        ELSE NULL
      END AS km_per_liter
    FROM vehicles v
    LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
    LEFT JOIN fuel_logs fl ON fl.vehicle_id = v.id
    WHERE v.status != 'Retired'
    GROUP BY v.id, v.registration_number, v.name_model, v.type
    ORDER BY km_per_liter DESC NULLS LAST
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/reports/utilization — fleet utilization over time
router.get('/utilization', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      v.id,
      v.registration_number,
      v.name_model,
      v.status,
      COUNT(t.id) FILTER (WHERE t.status = 'Completed') AS completed_trips,
      COUNT(t.id) FILTER (WHERE t.status = 'Dispatched') AS active_trips,
      COALESCE(SUM(t.planned_distance) FILTER (WHERE t.status = 'Completed'), 0) AS total_km
    FROM vehicles v
    LEFT JOIN trips t ON t.vehicle_id = v.id
    WHERE v.status != 'Retired'
    GROUP BY v.id, v.registration_number, v.name_model, v.status
    ORDER BY total_km DESC
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/reports/cost — fuel + maintenance cost per vehicle
router.get('/cost', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      v.id,
      v.registration_number,
      v.name_model,
      v.acquisition_cost,
      COALESCE(fuel.total_fuel_cost, 0) AS total_fuel_cost,
      COALESCE(maint.total_maintenance_cost, 0) AS total_maintenance_cost,
      COALESCE(fuel.total_fuel_cost, 0) + COALESCE(maint.total_maintenance_cost, 0) AS total_operating_cost
    FROM vehicles v
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS total_fuel_cost FROM fuel_logs GROUP BY vehicle_id
    ) fuel ON fuel.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS total_maintenance_cost
      FROM maintenance_logs WHERE status = 'Closed' GROUP BY vehicle_id
    ) maint ON maint.vehicle_id = v.id
    WHERE v.status != 'Retired'
    ORDER BY total_operating_cost DESC
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/reports/roi — ROI per vehicle
router.get('/roi', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      v.id,
      v.registration_number,
      v.name_model,
      v.acquisition_cost,
      COALESCE(fuel.total_fuel_cost, 0) + COALESCE(maint.total_maintenance_cost, 0) AS total_cost,
      CASE
        WHEN v.acquisition_cost > 0
        THEN ROUND(
          ((COALESCE(fuel.total_fuel_cost, 0) + COALESCE(maint.total_maintenance_cost, 0)) / v.acquisition_cost * 100)::numeric,
          2
        )
        ELSE NULL
      END AS cost_to_acquisition_pct
    FROM vehicles v
    LEFT JOIN (SELECT vehicle_id, SUM(cost) AS total_fuel_cost FROM fuel_logs GROUP BY vehicle_id) fuel ON fuel.vehicle_id = v.id
    LEFT JOIN (SELECT vehicle_id, SUM(cost) AS total_maintenance_cost FROM maintenance_logs WHERE status = 'Closed' GROUP BY vehicle_id) maint ON maint.vehicle_id = v.id
    ORDER BY cost_to_acquisition_pct DESC NULLS LAST
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/reports/export/csv — download any report as CSV
router.get('/export/csv', authenticate, asyncHandler(async (req, res) => {
  const { type } = req.query;
  let rows;
  let filename;

  if (type === 'fuel-efficiency') {
    const result = await pool.query(`
      SELECT v.registration_number, v.name_model, v.type,
             COALESCE(SUM(t.planned_distance),0) AS total_distance_km,
             COALESCE(SUM(fl.liters),0) AS total_fuel_liters,
             CASE WHEN COALESCE(SUM(fl.liters),0)>0 THEN ROUND((SUM(t.planned_distance)/SUM(fl.liters))::numeric,2) ELSE NULL END AS km_per_liter
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id=v.id AND t.status='Completed'
      LEFT JOIN fuel_logs fl ON fl.vehicle_id=v.id
      WHERE v.status!='Retired'
      GROUP BY v.id,v.registration_number,v.name_model,v.type
    `);
    rows = result.rows;
    filename = 'fuel_efficiency.csv';
  } else if (type === 'cost') {
    const result = await pool.query(`
      SELECT v.registration_number, v.name_model,
             COALESCE(fuel.total_fuel_cost,0) AS total_fuel_cost,
             COALESCE(maint.total_maintenance_cost,0) AS total_maintenance_cost,
             COALESCE(fuel.total_fuel_cost,0)+COALESCE(maint.total_maintenance_cost,0) AS total_operating_cost
      FROM vehicles v
      LEFT JOIN (SELECT vehicle_id,SUM(cost) AS total_fuel_cost FROM fuel_logs GROUP BY vehicle_id) fuel ON fuel.vehicle_id=v.id
      LEFT JOIN (SELECT vehicle_id,SUM(cost) AS total_maintenance_cost FROM maintenance_logs WHERE status='Closed' GROUP BY vehicle_id) maint ON maint.vehicle_id=v.id
      WHERE v.status!='Retired'
    `);
    rows = result.rows;
    filename = 'cost_report.csv';
  } else {
    const result = await pool.query(`SELECT * FROM trips ORDER BY created_at DESC`);
    rows = result.rows;
    filename = 'trips_report.csv';
  }

  if (!rows.length) {
    return res.status(204).send();
  }

  const headers = Object.keys(rows[0]).join(',');
  const csvRows = rows.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(','));
  const csv = [headers, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}));

module.exports = router;
