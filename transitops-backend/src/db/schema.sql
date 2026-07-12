-- ============================================================
-- TransitOps — PostgreSQL Schema Migration
-- Run once: psql "$DATABASE_URL" -f src/db/schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('fleet_manager','driver','safety_officer','financial_analyst','dispatcher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure 'dispatcher' is added if type already exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'dispatcher';

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('Available','On Trip','In Shop','Retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('Available','On Trip','Off Duty','Suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('Draft','Dispatched','Completed','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('Open','Closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  role           user_role NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Vehicles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number  TEXT UNIQUE NOT NULL,
  name_model           TEXT NOT NULL,
  type                 TEXT NOT NULL,
  max_load_capacity    NUMERIC NOT NULL CHECK (max_load_capacity > 0),
  odometer             NUMERIC DEFAULT 0 CHECK (odometer >= 0),
  acquisition_cost     NUMERIC NOT NULL CHECK (acquisition_cost >= 0),
  status               vehicle_status NOT NULL DEFAULT 'Available',
  region               TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Drivers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  license_number       TEXT UNIQUE NOT NULL,
  license_category     TEXT NOT NULL,
  license_expiry_date  DATE NOT NULL,
  contact_number       TEXT,
  safety_score         NUMERIC DEFAULT 100 CHECK (safety_score BETWEEN 0 AND 100),
  status               driver_status NOT NULL DEFAULT 'Available',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trips ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source            TEXT NOT NULL,
  destination       TEXT NOT NULL,
  vehicle_id        UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id         UUID REFERENCES drivers(id) ON DELETE SET NULL,
  cargo_weight      NUMERIC NOT NULL CHECK (cargo_weight > 0),
  planned_distance  NUMERIC NOT NULL CHECK (planned_distance > 0),
  final_odometer    NUMERIC,
  fuel_consumed     NUMERIC,
  status            trip_status NOT NULL DEFAULT 'Draft',
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  dispatched_at     TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ
);

-- ── Maintenance Logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  cost        NUMERIC DEFAULT 0 CHECK (cost >= 0),
  status      maintenance_status NOT NULL DEFAULT 'Open',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  closed_at   TIMESTAMPTZ
);

-- ── Fuel Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  trip_id     UUID REFERENCES trips(id) ON DELETE SET NULL,
  liters      NUMERIC NOT NULL CHECK (liters > 0),
  cost        NUMERIC NOT NULL CHECK (cost > 0),
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Expenses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  category     TEXT NOT NULL,
  amount       NUMERIC NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status  ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trips_status    ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle   ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver    ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle    ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_logs(vehicle_id);

-- ── Updated_at trigger function ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Trip Incidents ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_incidents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  reported_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  incident_type  TEXT NOT NULL,
  location       TEXT,
  photo_url      TEXT,
  comments       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_incidents_trip ON trip_incidents(trip_id);

