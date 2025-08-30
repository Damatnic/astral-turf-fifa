import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { canAccessRoute } from '../config/routePermissions';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children?: React.ReactElement;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

/**
 * Enhanced ProtectedRoute component that checks authentication status
 * and role-based permissions, redirecting as appropriate.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredPermissions,
  fallbackPath = '/dashboard'
}) => {
  const { authState } = useAuthContext();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated || !authState.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check route-specific permissions if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(authState.user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check global route permissions from configuration
  const { canAccess, fallbackPath: configFallback } = canAccessRoute(
    location.pathname,
    authState.user.role,
    requiredPermissions || []
  );

  if (!canAccess) {
    return <Navigate to={configFallback || fallbackPath} replace />;
  }

  // Additional permission checks based on user role and context
  if (authState.user.role === 'family') {
    // Family members need approved associations to access most features
    if (authState.familyAssociations.length === 0) {
      // If no family associations exist, redirect to setup page
      if (location.pathname !== '/family-setup') {
        return <Navigate to="/family-setup" replace />;
      }
    }

    // Check if any associations are approved by coach
    const hasApprovedAssociation = authState.familyAssociations.some(
      assoc => assoc.approvedByCoach
    );
    
    if (!hasApprovedAssociation && location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  if (authState.user.role === 'player') {
    // Players need to be linked to player data
    if (!authState.user.playerId && location.pathname !== '/player-setup') {
      return <Navigate to="/player-setup" replace />;
    }
  }

  // Check if user account needs password reset
  if (authState.user.needsPasswordReset && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  // Check if user account is active
  if (!authState.user.isActive && location.pathname !== '/account-suspended') {
    return <Navigate to="/account-suspended" replace />;
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};

export default ProtectedRoute;