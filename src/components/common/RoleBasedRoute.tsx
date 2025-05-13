
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
  
  // Add comprehensive debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role,
    allowedRoles,
    authLoading,
    roleLoading,
    isAuthenticated: !!user,
    isRoleAllowed: role ? allowedRoles.includes(role) : false
  });
  
  // IMPROVED: Show loading while checking auth state OR role
  // This ensures we never redirect prematurely while either is still loading
  if (authLoading || roleLoading) {
    console.log('RoleBasedRoute: Still loading auth or role data, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // IMPROVED: Only redirect to sign-in if auth has FINISHED loading and user is not authenticated
  if (!user) {
    console.log('RoleBasedRoute: User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // IMPROVED: Only check role after confirming we have a valid user AND role loading is complete
  if (!allowedRoles.includes(role || '') && location.pathname !== redirectTo) {
    console.log(`RoleBasedRoute: Role ${role} not allowed, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  console.log('RoleBasedRoute: All checks passed, rendering children');
  return <>{children}</>;
};

export default RoleBasedRoute;
