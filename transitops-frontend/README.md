# TransitOps — Frontend

> React + Vite frontend for the TransitOps Smart Transport Operations Platform.

## Stack
- **Framework:** React 18 + Vite
- **Routing:** react-router-dom v6
- **Forms:** react-hook-form + @hookform/resolvers + Zod
- **HTTP:** Axios (with JWT interceptor)
- **Charts:** Recharts
- **Toasts:** react-hot-toast
- **Styling:** Vanilla CSS with CSS Modules + CSS Custom Properties
- **Deploy:** Vercel (static)

## Quick Start (Local)

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env.local
# → Set VITE_API_BASE_URL=http://localhost:5000

# 3. Start dev server
npm run dev
# App available at http://localhost:5173
```

> Make sure the backend is running at `localhost:5000` (or whatever your `VITE_API_BASE_URL` points to).

## Deployment (Vercel)

1. Push this folder as its own GitHub repo
2. Import into Vercel — auto-detected as Vite
3. Set environment variable in Vercel Dashboard:
   - `VITE_API_BASE_URL=https://your-backend.vercel.app`
4. Deploy

## Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| Fleet Manager | manager@transitops.dev | Manager@123 |
| Driver | driver@transitops.dev | Driver@123 |
| Safety Officer | safety@transitops.dev | Safety@123 |
| Financial Analyst | finance@transitops.dev | Finance@123 |

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/dashboard` | KPI Dashboard | All roles |
| `/vehicles` | Vehicle Registry | All (CRUD: fleet_manager) |
| `/drivers` | Driver Management | All (CRUD: safety_officer) |
| `/trips` | Trip List | All |
| `/trips/new` | Trip Wizard | driver, fleet_manager |
| `/maintenance` | Maintenance Logs | All (manage: fleet_manager) |
| `/fuel-expenses` | Fuel & Expenses | All (manage: driver/financial_analyst) |
| `/reports` | Reports & Analytics | All |

## Project Structure

```
transitops-frontend/
├── public/
├── src/
│   ├── main.jsx              # App entry
│   ├── App.jsx               # Router + lazy pages
│   ├── index.css             # Global design system (CSS vars)
│   ├── context/
│   │   └── AuthContext.jsx   # Session + role state
│   ├── lib/
│   │   └── apiClient.js      # Axios + JWT interceptor
│   ├── hooks/
│   │   ├── useApi.js         # Generic fetch hook
│   │   ├── useVehicles.js
│   │   ├── useDrivers.js
│   │   ├── useTrips.js
│   │   └── useDashboard.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx / .module.css
│   │   │   ├── Sidebar.jsx   / .module.css
│   │   │   ├── Navbar.jsx    / .module.css
│   │   │   └── ProtectedRoute.jsx
│   │   └── ui/
│   │       ├── KpiCard.jsx   / .module.css
│   │       ├── StatusBadge.jsx / .module.css
│   │       ├── PageLoader.jsx / .module.css
│   │       └── ErrorBoundary.jsx / .module.css
│   └── pages/
│       ├── LandingPage.jsx   / .module.css
│       ├── LoginPage.jsx     / .module.css
│       ├── DashboardPage.jsx / .module.css
│       ├── VehiclesPage.jsx
│       ├── DriversPage.jsx
│       ├── TripsPage.jsx     / .module.css
│       ├── TripWizard.jsx    / .module.css
│       ├── MaintenancePage.jsx
│       ├── FuelExpensesPage.jsx / .module.css
│       ├── ReportsPage.jsx   / .module.css
│       └── NotFoundPage.jsx  / .module.css
├── .env.example
├── vite.config.js
└── package.json
```
