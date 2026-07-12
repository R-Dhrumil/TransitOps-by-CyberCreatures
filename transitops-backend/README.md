# TransitOps — Backend API

> Express.js + PostgreSQL (Railway) backend for the TransitOps Smart Transport Operations Platform.

## Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL on Railway
- **Auth:** bcrypt + JWT
- **Validation:** Zod
- **Deploy:** Vercel Serverless Functions

## Quick Start (Local)

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# → Fill in DATABASE_URL, JWT_SECRET

# 3. Run schema migration
npm run migrate

# 4. Seed demo users + sample data
npm run seed

# 5. Start dev server
npm run dev
# API available at http://localhost:5000
```

## Seed Demo Accounts

| Role | Email | Password |
|---|---|---|
| Fleet Manager | manager@transitops.dev | Manager@123 |
| Driver | driver@transitops.dev | Driver@123 |
| Safety Officer | safety@transitops.dev | Safety@123 |
| Financial Analyst | finance@transitops.dev | Finance@123 |

## Deployment (Vercel)

1. Push this folder as its own GitHub repo
2. Import into Vercel → auto-detects the `api/index.js` serverless entry
3. Set environment variables in Vercel Dashboard:
   - `DATABASE_URL` (from Railway → Postgres → Connect tab)
   - `JWT_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `CORS_ORIGIN` (your frontend Vercel URL)
4. Deploy

## API Routes

All routes prefixed with `/api`. See `src/routes/` for full implementation.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/dashboard/kpis` | JWT | Fleet KPIs |
| GET/POST | `/api/vehicles` | JWT | Vehicle CRUD |
| PATCH | `/api/vehicles/:id` | fleet_manager | Update vehicle |
| DELETE | `/api/vehicles/:id` | fleet_manager | Retire vehicle |
| GET/POST | `/api/drivers` | JWT | Driver CRUD |
| GET/POST | `/api/trips` | JWT | Trip list + create |
| PATCH | `/api/trips/:id/dispatch` | driver | Draft → Dispatched |
| PATCH | `/api/trips/:id/complete` | driver | Dispatched → Completed |
| PATCH | `/api/trips/:id/cancel` | driver | → Cancelled |
| GET/POST | `/api/maintenance` | JWT | Maintenance logs |
| PATCH | `/api/maintenance/:id/close` | fleet_manager | Close maintenance |
| GET/POST | `/api/fuel-logs` | JWT | Fuel logging |
| GET/POST | `/api/expenses` | financial_analyst | Expense tracking |
| GET | `/api/reports/*` | JWT | Analytics reports |
| GET | `/api/reports/export/csv` | JWT | CSV export |

## Project Structure

```
transitops-backend/
├── api/
│   └── index.js          # Vercel serverless entry
├── src/
│   ├── app.js            # Express app
│   ├── server.js         # Local dev server (with app.listen)
│   ├── db/
│   │   ├── pool.js       # pg.Pool singleton
│   │   ├── transaction.js # withTransaction helper
│   │   ├── schema.sql    # Full DB schema
│   │   ├── migrate.js    # Migration runner
│   │   └── seed.js       # Demo data seeder
│   ├── middleware/
│   │   ├── auth.js       # JWT authenticate + requireRole
│   │   ├── validate.js   # Zod validation middleware
│   │   └── errorHandler.js # Central error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── driver.routes.js
│   │   ├── trip.routes.js
│   │   ├── maintenance.routes.js
│   │   ├── fuel.routes.js
│   │   ├── expense.routes.js
│   │   └── report.routes.js
│   ├── utils/
│   │   ├── AppError.js   # Custom error class
│   │   └── asyncHandler.js # Async route wrapper
│   └── validators/
│       └── schemas.js    # All Zod schemas
├── .env.example          # Copy → .env
├── vercel.json           # Vercel serverless config
└── package.json
```
