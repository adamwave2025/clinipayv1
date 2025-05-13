
import React, { useState, useEffect, useRef } from 'react';
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
  const { role, loading: roleLoading, initialFetchComplete } = useUserRole();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const redirectDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Check if current path (without query parameters) matches redirectTo
  const isOnRedirectPath = () => {
    // Extract base path without query params
    const currentBasePath = location.pathname;
    return currentBasePath === redirectTo;
  };
  
  // Add debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role, 
    allowedRoles,
    authLoading,
    roleLoading,
    initialFetchComplete,
    shouldRedirect,
    redirectReason
  });
  
  useEffect(() => {
    // Only evaluate redirect after loading is complete and initial fetch is done
    if (!authLoading && !roleLoading && initialFetchComplete) {
      // Clear any existing timer
      if (redirectDebounceTimer.current) {
        clearTimeout(redirectDebounceTimer.current);
      }
      
      // Set a small debounce to prevent rapid redirect changes
      redirectDebounceTimer.current = setTimeout(() => {
        if (!user) {
          setShouldRedirect(true);
          setRedirectReason('User not authenticated');
        } else if (role && !allowedRoles.includes(role) && !isOnRedirectPath()) {
          setShouldRedirect(true);
          setRedirectReason(`Role ${role} not allowed, only ${allowedRoles.join(', ')} can access`);
        } else {
          setShouldRedirect(false);
          setRedirectReason(null);
        }
      }, 100);
    }
    
    // Clean up timeout on unmount
    return () => {
      if (redirectDebounceTimer.current) {
        clearTimeout(redirectDebounceTimer.current);
      }
    };
  }, [user, role, allowedRoles, authLoading, roleLoading, initialFetchComplete, location.pathname, redirectTo]);
  
  // Show loading while checking auth state or role
  if (authLoading || roleLoading || !initialFetchComplete) {
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
  if (shouldRedirect && !isOnRedirectPath()) {
    console.log(`${redirectReason}, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default RoleBasedRoute;
