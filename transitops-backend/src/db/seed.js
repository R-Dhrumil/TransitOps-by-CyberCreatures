'use strict';
require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('./pool');

/**
 * Seeds one user per role for hackathon demo.
 * Run: npm run seed
 * Uses ON CONFLICT DO NOTHING so it's safe to re-run.
 */
const SEED_USERS = [
  { email: 'manager@transitops.dev',   password: 'Manager@123',   full_name: 'Alex Manager',    role: 'fleet_manager' },
  { email: 'driver@transitops.dev',    phone: '9876543210',       password: 'Driver@123',    full_name: 'Sam Driver',       role: 'driver' },
  { email: 'safety@transitops.dev',    password: 'Safety@123',    full_name: 'Jordan Safety',    role: 'safety_officer' },
  { email: 'finance@transitops.dev',   password: 'Finance@123',   full_name: 'Taylor Finance',   role: 'financial_analyst' },
  { email: 'dispatcher@transitops.dev',password: 'Dispatcher@123',full_name: 'Dev Dispatcher',   role: 'dispatcher' },
];

const SEED_VEHICLES = [
  { registration_number: 'MH12AB1234', name_model: 'Tata Prima 4028.S', type: 'Heavy Truck', max_load_capacity: 25000, acquisition_cost: 3500000, odometer: 45200, region: 'West' },
  { registration_number: 'MH14CD5678', name_model: 'Ashok Leyland Boss', type: 'Medium Truck', max_load_capacity: 12000, acquisition_cost: 2100000, odometer: 32100, region: 'West' },
  { registration_number: 'DL01EF9012', name_model: 'Eicher Pro 3015', type: 'Light Truck', max_load_capacity: 7500, acquisition_cost: 1400000, odometer: 21500, region: 'North' },
  { registration_number: 'KA05GH3456', name_model: 'BharatBenz 1215R', type: 'Medium Truck', max_load_capacity: 11000, acquisition_cost: 1950000, odometer: 58900, region: 'South', status: 'In Shop' },
  { registration_number: 'GJ01KL8899', name_model: 'Mahindra Blazo X', type: 'Heavy Truck', max_load_capacity: 28000, acquisition_cost: 3800000, odometer: 15200, region: 'West' },
  { registration_number: 'TN02MN5566', name_model: 'Tata Signa 4225.T', type: 'Heavy Truck', max_load_capacity: 30000, acquisition_cost: 4100000, odometer: 89000, region: 'South', status: 'On Trip' },
  { registration_number: 'UP32PQ1122', name_model: 'Ashok Leyland Dost+', type: 'Light Truck', max_load_capacity: 1500, acquisition_cost: 750000, odometer: 4200, region: 'North' },
  { registration_number: 'WB04RS7744', name_model: 'Eicher Pro 2049', type: 'Light Truck', max_load_capacity: 5000, acquisition_cost: 1200000, odometer: 11500, region: 'East' },
  { registration_number: 'RJ14TV9900', name_model: 'BharatBenz 2823C', type: 'Medium Truck', max_load_capacity: 16000, acquisition_cost: 2800000, odometer: 75300, region: 'North' },
  { registration_number: 'TS07XY3322', name_model: 'Mahindra Furio 14', type: 'Medium Truck', max_load_capacity: 14000, acquisition_cost: 2200000, odometer: 55400, region: 'South' },
];

const SEED_DRIVERS = [
  { name: 'Ravi Kumar',   license_number: 'DL0420110012345', license_category: 'HMV', license_expiry_date: '2027-03-15', contact_number: '9876543210', safety_score: 95 },
  { name: 'Suresh Patil', license_number: 'MH1220090067890', license_category: 'HMV', license_expiry_date: '2025-11-30', contact_number: '9123456789', safety_score: 88 },
  { name: 'Anita Singh',  license_number: 'KA0320150034567', license_category: 'LMV', license_expiry_date: '2028-07-22', contact_number: '9012345678', safety_score: 97 },
  { name: 'Vikram Sharma', license_number: 'RJ1420180055443', license_category: 'HMV', license_expiry_date: '2029-01-10', contact_number: '9988776655', safety_score: 92 },
  { name: 'Pooja Reddy',  license_number: 'TS0720190011223', license_category: 'LMV', license_expiry_date: '2026-05-18', contact_number: '9871234560', safety_score: 99 },
  { name: 'Amit Das',     license_number: 'WB0420100099887', license_category: 'HMV', license_expiry_date: '2022-12-05', contact_number: '9112233445', safety_score: 85 }, // Expired
  { name: 'Neha Gupta',   license_number: 'UP3220200033445', license_category: 'LMV', license_expiry_date: '2030-08-14', contact_number: '9998887776', safety_score: 94 },
  { name: 'Mohammed Ali', license_number: 'KL0120120077665', license_category: 'HMV', license_expiry_date: '2026-11-20', contact_number: '9887766554', safety_score: 91, status: 'On Trip' },
  { name: 'Simran Kaur',  license_number: 'PB1020170022334', license_category: 'LMV', license_expiry_date: '2027-09-09', contact_number: '9776655443', safety_score: 89 },
  { name: 'Kiran Desai',  license_number: 'GJ0120150044556', license_category: 'HMV', license_expiry_date: '2025-02-28', contact_number: '9665544332', safety_score: 96 },
];

const seed = async () => {
  console.log('[Seed] Starting seed...');

  // Users
  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [u.email, u.phone || null, hash, u.full_name, u.role]
    );
    console.log(`[Seed] User seeded: ${u.email} (${u.role})`);
  }

  // Vehicles
  for (const v of SEED_VEHICLES) {
    await pool.query(
      `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, acquisition_cost, odometer, region, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (registration_number) DO NOTHING`,
      [v.registration_number, v.name_model, v.type, v.max_load_capacity, v.acquisition_cost, v.odometer || 0, v.region || null, v.status || 'Available']
    );
    console.log(`[Seed] Vehicle seeded: ${v.registration_number}`);
  }

  // Drivers
  for (const d of SEED_DRIVERS) {
    const isExpired = new Date(d.license_expiry_date) < new Date();
    const status = isExpired ? 'Suspended' : (d.status || 'Available');
    
    await pool.query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (license_number) DO NOTHING`,
      [d.name, d.license_number, d.license_category, d.license_expiry_date, d.contact_number, d.safety_score, status]
    );

    // Auto-create user for driver
    try {
      const passwordHash = await bcrypt.hash(d.license_number, 12);
      const fakeEmail = `${d.license_number.toLowerCase()}@transitops.local`;
      await pool.query(
        `INSERT INTO users (email, phone, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, 'driver')
         ON CONFLICT DO NOTHING`,
        [fakeEmail, d.contact_number || d.license_number, passwordHash, d.name]
      );
    } catch (e) {
      console.error('Failed to auto-create user for driver:', e.message);
    }
    
    console.log(`[Seed] Driver seeded: ${d.name}`);
  }

  // Trips
  const vRows = await pool.query('SELECT id, registration_number, odometer FROM vehicles');
  const dRows = await pool.query("SELECT id, name FROM drivers WHERE status != 'Suspended'");
  const dispatcherRes = await pool.query("SELECT id FROM users WHERE role = 'dispatcher' LIMIT 1");
  const dispatcherId = dispatcherRes.rows[0]?.id;

  if (vRows.rows.length >= 3 && dRows.rows.length >= 3) {
    const tripsToSeed = [
      { source: 'Mumbai Port', destination: 'Pune Hub', vehicle: vRows.rows[0], driver: dRows.rows[0], weight: 12000, dist: 150, status: 'Completed', c_days: 5, comp_days: 4 },
      { source: 'Delhi Depot', destination: 'Gurugram Facility', vehicle: vRows.rows[1], driver: dRows.rows[1], weight: 8000, dist: 40, status: 'Dispatched', c_days: 1 },
      { source: 'Chennai Port', destination: 'Bengaluru Hub', vehicle: vRows.rows[2], driver: dRows.rows[2], weight: 15000, dist: 350, status: 'Draft', c_days: 0 },
      { source: 'Kolkata Warehouse', destination: 'Patna Center', vehicle: vRows.rows[3], driver: dRows.rows[3], weight: 9500, dist: 580, status: 'Dispatched', c_days: 2 },
      { source: 'Ahmedabad Plant', destination: 'Surat Hub', vehicle: vRows.rows[4], driver: dRows.rows[4], weight: 22000, dist: 260, status: 'Completed', c_days: 10, comp_days: 9 },
      { source: 'Hyderabad Hub', destination: 'Vijayawada Depot', vehicle: vRows.rows[5], driver: dRows.rows[5], weight: 18000, dist: 275, status: 'Cancelled', c_days: 3 },
      { source: 'Pune Hub', destination: 'Nagpur Center', vehicle: vRows.rows[0], driver: dRows.rows[0], weight: 14000, dist: 710, status: 'Dispatched', c_days: 0 },
      { source: 'Gurugram Facility', destination: 'Jaipur Depot', vehicle: vRows.rows[1], driver: dRows.rows[1], weight: 7500, dist: 240, status: 'Draft', c_days: 0 },
    ];

    for (const t of tripsToSeed) {
      if (!t.vehicle || !t.driver) continue;
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - t.c_days);
      const dispDate = t.status !== 'Draft' ? createdDate : null;
      let compDate = null;
      let cancDate = null;
      let fOdo = null;

      if (t.status === 'Completed') {
        compDate = new Date();
        compDate.setDate(compDate.getDate() - (t.comp_days || 0));
        fOdo = Number(t.vehicle.odometer) + t.dist;
      }
      if (t.status === 'Cancelled') {
        cancDate = new Date();
      }

      await pool.query(
        `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_by, created_at, dispatched_at, completed_at, cancelled_at, final_odometer)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [t.source, t.destination, t.vehicle.id, t.driver.id, t.weight, t.dist, t.status, dispatcherId, createdDate, dispDate, compDate, cancDate, fOdo]
      );
      console.log(`[Seed] Trip seeded: ${t.source} to ${t.destination} (${t.status})`);
    }
  }

  console.log('[Seed] ✅ Seed completed.');
  await pool.end();
};

seed().catch((err) => {
  console.error('[Seed] ❌ Seed failed:', err.message);
  process.exit(1);
});
