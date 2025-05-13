
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Role-based route protection component
 * Ensures user is authenticated AND has an allowed role
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/dashboard'
}) => {
  const { 
    isAuthenticated,
    isFullyLoaded,
    isLoading,
    role,
    debugState
  } = useUnifiedAuth();
  
  const location = useLocation();

  // Enhanced logging for role-based access
  console.log('[ROLE ROUTE]', { 
    path: location.pathname,
    userRole: role,
    allowedRoles,
    isAuthenticated,
    isFullyLoaded,
    authLoading: isLoading,
    ...debugState
  });

  // Show loading while we determine auth state or role
  if (isLoading || !isFullyLoaded) {
    console.log('[ROLE ROUTE] Auth data still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    console.log('[ROLE ROUTE] User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Role check - only proceed if role matches allowed roles
  const hasAllowedRole = role && allowedRoles.includes(role);

  if (!hasAllowedRole) {
    console.log(`[ROLE ROUTE] User role "${role}" not allowed. Allowed roles:`, allowedRoles, 'Redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if authenticated and role is allowed
  console.log(`[ROLE ROUTE] Access granted for role "${role}"`);
  return <>{children}</>;
};

export default RoleRoute;
