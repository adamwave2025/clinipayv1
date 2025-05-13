
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard'
}) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  
  // Combined loading state - we're loading if EITHER auth OR role is still loading
  const isLoading = authLoading || roleLoading;
  
  // Add comprehensive debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role,
    allowedRoles,
    authLoading,
    roleLoading,
    isLoading,
    isAuthenticated: !!user,
    isRoleAllowed: role ? allowedRoles.includes(role) : false,
    redirectingToSignIn: !isLoading && !user,
    redirectingToDashboard: !isLoading && user && role && !allowedRoles.includes(role)
  });
  
  // CRITICAL: Show loading while checking auth state OR role
  // This ensures we never redirect prematurely while either is still loading
  if (isLoading) {
    console.log('RoleBasedRoute: Still loading auth or role data, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only redirect to sign-in if BOTH auth AND role have FINISHED loading
  // and we still don't have a user (meaning they're not authenticated)
  if (!user) {
    console.log('RoleBasedRoute: User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // IMPORTANT: Only check role access after confirming:
  // 1. Both auth and role loading are complete (isLoading === false)
  // 2. We have a valid user (user is not null)
  // 3. We have a role value (which might be null but we've finished trying to get it)
  // 4. The current location is not already the fallback destination
  if (role && !allowedRoles.includes(role) && location.pathname !== redirectTo) {
    console.log(`RoleBasedRoute: Role ${role} not allowed, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  console.log('RoleBasedRoute: All checks passed, rendering children');
  return <>{children}</>;
};

export default RoleBasedRoute;
