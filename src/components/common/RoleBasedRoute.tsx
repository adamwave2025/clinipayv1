
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
  
  // Add debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role, 
    allowedRoles,
    authLoading,
    roleLoading
  });
  
  // Show loading while checking auth state or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If user's role is not allowed, redirect to the specified route
  // Only redirect if we're not already on the redirectTo path (prevents loops)
  if (!allowedRoles.includes(role || '') && location.pathname !== redirectTo) {
    console.log(`Role ${role} not allowed, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default RoleBasedRoute;
