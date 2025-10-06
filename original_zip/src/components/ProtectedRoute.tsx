import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

interface ProtectedRouteProps {
  children?: React.ReactElement;
}

/**
 * ProtectedRoute component that checks authentication status
 * and redirects to login if user is not authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useAuthContext();

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
