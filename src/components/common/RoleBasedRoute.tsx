
import React, { useState, useEffect } from 'react';
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
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  
  // Add debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role, 
    allowedRoles,
    authLoading,
    roleLoading,
    shouldRedirect,
    redirectReason
  });
  
  useEffect(() => {
    // Only evaluate redirect after loading is complete
    if (!authLoading && !roleLoading) {
      if (!user) {
        setShouldRedirect(true);
        setRedirectReason('User not authenticated');
      } else if (role && !allowedRoles.includes(role) && location.pathname !== redirectTo) {
        setShouldRedirect(true);
        setRedirectReason(`Role ${role} not allowed, only ${allowedRoles.join(', ')} can access`);
      } else {
        setShouldRedirect(false);
        setRedirectReason(null);
      }
    }
  }, [user, role, allowedRoles, authLoading, roleLoading, location.pathname, redirectTo]);
  
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
    console.log('User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If redirect evaluation determined we should redirect
  if (shouldRedirect && location.pathname !== redirectTo) {
    console.log(`${redirectReason}, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default RoleBasedRoute;
