import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk')
  );
};

const lazyWithRetry = (importer, key) =>
  lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const storageKey = `chunk-reload:${key}`;
      const hasRetried = sessionStorage.getItem(storageKey) === '1';

      if (isChunkLoadError(error) && !hasRetried) {
        sessionStorage.setItem(storageKey, '1');
        window.location.reload();
        // Keep suspense pending while reload is triggered.
        return new Promise(() => {});
      }

      throw error;
    }
  });

// Lazy-load pages for code splitting
const LandingPage        = lazyWithRetry(() => import('./pages/LandingPage.jsx'), 'landing');
const LoginPage          = lazyWithRetry(() => import('./pages/LoginPage.jsx'), 'login');
const DashboardPage      = lazyWithRetry(() => import('./pages/DashboardPage.jsx'), 'dashboard');
const VehiclesPage       = lazyWithRetry(() => import('./pages/VehiclesPage.jsx'), 'vehicles');
const DriversPage        = lazyWithRetry(() => import('./pages/DriversPage.jsx'), 'drivers');
const TripsPage          = lazyWithRetry(() => import('./pages/TripsPage.jsx'), 'trips');
const TripWizard         = lazyWithRetry(() => import('./pages/TripWizard.jsx'), 'trip-wizard');
const MaintenancePage    = lazyWithRetry(() => import('./pages/MaintenancePage.jsx'), 'maintenance');
const FuelExpensesPage   = lazyWithRetry(() => import('./pages/FuelExpensesPage.jsx'), 'fuel-expenses');
const ReportsPage        = lazyWithRetry(() => import('./pages/ReportsPage.jsx'), 'reports');
const QuickReportPage    = lazyWithRetry(() => import('./pages/QuickReportPage.jsx'), 'quick-report');
const NotFoundPage       = lazyWithRetry(() => import('./pages/NotFoundPage.jsx'), 'not-found');

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
              <Route path="/quick-report" element={<QuickReportPage />} />

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
