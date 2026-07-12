'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2),
  role: z.enum(['fleet_manager', 'driver', 'safety_officer', 'financial_analyst', 'dispatcher']),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

const vehicleSchema = z.object({
  registration_number: z.string().min(1),
  name_model: z.string().min(1),
  type: z.string().min(1),
  max_load_capacity: z.number().positive(),
  acquisition_cost: z.number().nonnegative(),
  odometer: z.number().nonnegative().optional(),
  region: z.string().optional(),
});

const vehicleUpdateSchema = vehicleSchema.partial();

const driverSchema = z.object({
  name: z.string().min(2),
  license_number: z.string().min(5),
  license_category: z.string().min(2),
  license_expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  contact_number: z.string().optional(),
  safety_score: z.number().min(0).max(100).optional(),
});

const driverUpdateSchema = driverSchema.partial().extend({
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended', 'Retired']).optional(),
});

const tripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  cargo_weight: z.number().positive(),
  planned_distance: z.number().positive(),
});

const tripCompleteSchema = z.object({
  final_odometer: z.number().nonnegative(),
  fuel_consumed: z.number().positive().optional(),
  fuel_cost: z.number().positive().optional(),
});

const maintenanceSchema = z.object({
  vehicle_id: z.string().uuid(),
  description: z.string().min(5),
  cost: z.number().nonnegative().optional(),
});

const fuelLogSchema = z.object({
  vehicle_id: z.string().uuid(),
  trip_id: z.string().uuid().optional(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  log_date: z.string().optional(),
});

const expenseSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  category: z.string().min(1),
  amount: z.number().positive(),
  expense_date: z.string().optional(),
  notes: z.string().optional(),
});

const incidentSchema = z.object({
  incident_type: z.enum([
    'Traffic Jam',
    'Accident/Collision',
    'Vehicle Breakdown',
    'Fuel Issue',
    'Bad Weather',
    'Road Closed',
    'Location Share'
  ]),
  location: z.string().optional(),
  photo_url: z.string().optional(),
  comments: z.string().optional(),
});

// Schema for fleet manager to create a new user account
const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['dispatcher', 'driver', 'safety_officer', 'financial_analyst'], {
    errorMap: () => ({ message: 'Role must be one of: dispatcher, driver, safety_officer, financial_analyst' }),
  }),
});

// Schema for updating a user's role
const updateUserRoleSchema = z.object({
  role: z.enum(['dispatcher', 'driver', 'safety_officer', 'financial_analyst'], {
    errorMap: () => ({ message: 'Role must be one of: dispatcher, driver, safety_officer, financial_analyst' }),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  vehicleSchema,
  vehicleUpdateSchema,
  driverSchema,
  driverUpdateSchema,
  tripSchema,
  tripCompleteSchema,
  maintenanceSchema,
  fuelLogSchema,
  expenseSchema,
  incidentSchema,
  createUserSchema,
  updateUserRoleSchema,
};
