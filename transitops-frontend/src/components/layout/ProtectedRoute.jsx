import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PageLoader from '../ui/PageLoader.jsx';

/**
 * ProtectedRoute — renders children (Outlet) only if authenticated.
 * If still loading session, shows PageLoader.
 * If not authenticated, redirects to /login with current path as state.
 * Optional `roles` prop for route-level RBAC guard.
 */
const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.some(r => r === user.role)) {
    return <Navigate to={user.role === 'driver' ? '/drivers' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
