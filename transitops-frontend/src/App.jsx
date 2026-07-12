import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

// Lazy-load pages for code splitting
const LandingPage        = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage          = lazy(() => import('./pages/LoginPage.jsx'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage.jsx'));
const VehiclesPage       = lazy(() => import('./pages/VehiclesPage.jsx'));
const DriversPage        = lazy(() => import('./pages/DriversPage.jsx'));
const TripsPage          = lazy(() => import('./pages/TripsPage.jsx'));
const TripWizard         = lazy(() => import('./pages/TripWizard.jsx'));
const MaintenancePage    = lazy(() => import('./pages/MaintenancePage.jsx'));
const FuelExpensesPage   = lazy(() => import('./pages/FuelExpensesPage.jsx'));
const ReportsPage        = lazy(() => import('./pages/ReportsPage.jsx'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/"       element={<LandingPage />} />
              <Route path="/login"  element={<LoginPage />} />

              {/* Protected routes — all rendered inside AppLayout (sidebar + navbar) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard"    element={<DashboardPage />} />
                  <Route path="/vehicles"     element={<VehiclesPage />} />
                  <Route path="/drivers"      element={<DriversPage />} />
                  <Route path="/trips"        element={<TripsPage />} />
                  <Route path="/trips/new"    element={<TripWizard />} />
                  <Route path="/maintenance"  element={<MaintenancePage />} />
                  <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
                  <Route path="/reports"      element={<ReportsPage />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
