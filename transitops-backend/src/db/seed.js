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
  { email: 'driver@transitops.dev',    password: 'Driver@123',    full_name: 'Sam Driver',       role: 'driver' },
  { email: 'safety@transitops.dev',    password: 'Safety@123',    full_name: 'Jordan Safety',    role: 'safety_officer' },
  { email: 'finance@transitops.dev',   password: 'Finance@123',   full_name: 'Taylor Finance',   role: 'financial_analyst' },
  { email: 'dispatcher@transitops.dev',password: 'Dispatcher@123',full_name: 'Dev Dispatcher',   role: 'dispatcher' },
];

const SEED_VEHICLES = [
  { registration_number: 'MH12AB1234', name_model: 'Tata Prima 4028.S', type: 'Heavy Truck', max_load_capacity: 25000, acquisition_cost: 3500000, odometer: 45200, region: 'West' },
  { registration_number: 'MH14CD5678', name_model: 'Ashok Leyland Boss', type: 'Medium Truck', max_load_capacity: 12000, acquisition_cost: 2100000, odometer: 32100, region: 'West' },
  { registration_number: 'DL01EF9012', name_model: 'Eicher Pro 3015', type: 'Light Truck', max_load_capacity: 7500, acquisition_cost: 1400000, odometer: 21500, region: 'North' },
  { registration_number: 'KA05GH3456', name_model: 'BharatBenz 1215R', type: 'Medium Truck', max_load_capacity: 11000, acquisition_cost: 1950000, odometer: 58900, region: 'South', status: 'In Shop' },
];

const SEED_DRIVERS = [
  { name: 'Ravi Kumar',   license_number: 'DL0420110012345', license_category: 'HMV', license_expiry_date: '2027-03-15', contact_number: '9876543210', safety_score: 95 },
  { name: 'Suresh Patil', license_number: 'MH1220090067890', license_category: 'HMV', license_expiry_date: '2025-11-30', contact_number: '9123456789', safety_score: 88 },
  { name: 'Anita Singh',  license_number: 'KA0320150034567', license_category: 'LMV', license_expiry_date: '2028-07-22', contact_number: '9012345678', safety_score: 97 },
];

const seed = async () => {
  console.log('[Seed] Starting seed...');

  // Users
  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.email, hash, u.full_name, u.role]
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
    await pool.query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (license_number) DO NOTHING`,
      [d.name, d.license_number, d.license_category, d.license_expiry_date, d.contact_number, d.safety_score]
    );
    console.log(`[Seed] Driver seeded: ${d.name}`);
  }

  console.log('[Seed] ✅ Seed completed.');
  await pool.end();
};

seed().catch((err) => {
  console.error('[Seed] ❌ Seed failed:', err.message);
  process.exit(1);
});
