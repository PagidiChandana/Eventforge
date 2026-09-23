import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../constants/roles';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * ProtectedRoute
 * - Unauthenticated → /login (preserves destination), except public routes (handled by not wrapping).
 * - Wrong role → redirect to the user's OWN dashboard with an unauthorized notice.
 *   Never renders another role's page.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen message="Verifying access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <Navigate
        to={getHomeForRole(user?.role)}
        state={{ notice: 'You are not authorized to access this page.' }}
        replace
      />
    );
  }

  return children;
};
