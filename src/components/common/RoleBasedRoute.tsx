import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  
  // Keep track of routing state to prevent loops
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const redirectDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const previousPathRef = useRef<string>(location.pathname);
  const redirectAttempts = useRef<number>(0);
  const lastRedirectTimeRef = useRef<number>(0);
  
  // Stable version of allowedRoles to avoid rerenders
  const allowedRolesMemoized = useMemo(() => allowedRoles, [allowedRoles.join(',')]);
  
  // Check if current path (without query parameters) matches redirectTo
  const isOnRedirectPath = () => {
    // Extract base path without query params
    const currentBasePath = location.pathname;
    const redirectToBasePath = redirectTo.split('?')[0];
    
    // Check if the current path starts with the redirect path (for nested routes)
    return currentBasePath === redirectToBasePath || 
           (redirectToBasePath !== '/dashboard' && currentBasePath.startsWith(redirectToBasePath));
  };
  
  // Add debug logging
  console.log('RoleBasedRoute:', { 
    path: location.pathname,
    user: user?.id, 
    role, 
    allowedRoles: allowedRolesMemoized,
    authLoading,
    roleLoading,
    initialFetchComplete,
    shouldRedirect,
    redirectReason,
    isOnRedirectPath: isOnRedirectPath(),
    redirectAttempts: redirectAttempts.current,
    timeSinceLastRedirect: Date.now() - lastRedirectTimeRef.current
  });
  
  // Reset redirect attempts when path changes significantly
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      // Only reset if it's a completely different path, not just query params changing
      console.log(`Path changed from ${previousPathRef.current} to ${location.pathname}, resetting redirect attempts`);
      redirectAttempts.current = 0;
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);
  
  // Prevent rapid redirects (rate limiting)
  const canRedirectNow = () => {
    const now = Date.now();
    const minTimeBetweenRedirects = 1000; // 1 second
    
    if (now - lastRedirectTimeRef.current < minTimeBetweenRedirects) {
      console.log('Blocking rapid redirect - too soon since last redirect');
      return false;
    }
    
    return true;
  };
  
  useEffect(() => {
    // Only evaluate redirect after loading is complete and initial fetch is done
    if (!authLoading && !roleLoading && initialFetchComplete) {
      // Clear any existing timer
      if (redirectDebounceTimer.current) {
        clearTimeout(redirectDebounceTimer.current);
      }
      
      // Set a larger debounce to prevent rapid redirect changes
      redirectDebounceTimer.current = setTimeout(() => {
        // Prevent infinite redirect loops
        if (redirectAttempts.current > 5) {
          console.warn('Too many redirect attempts, stopping redirection loop');
          setShouldRedirect(false);
          setRedirectReason("Redirect loop detected, allowing access");
          return;
        }
        
        // If we're on the redirect path, don't redirect again
        if (isOnRedirectPath()) {
          console.log('Already on redirect path, preventing further redirects');
          setShouldRedirect(false);
          setRedirectReason(null);
          return;
        }
        
        if (!user) {
          if (canRedirectNow()) {
            setShouldRedirect(true);
            setRedirectReason('User not authenticated');
            redirectAttempts.current++;
            lastRedirectTimeRef.current = Date.now();
          }
        } else if (role && !allowedRolesMemoized.includes(role)) {
          if (canRedirectNow()) {
            setShouldRedirect(true);
            setRedirectReason(`Role ${role} not allowed, only ${allowedRolesMemoized.join(', ')} can access`);
            redirectAttempts.current++;
            lastRedirectTimeRef.current = Date.now();
          }
        } else {
          setShouldRedirect(false);
          setRedirectReason(null);
          // Reset redirect attempts when no redirect is needed
          redirectAttempts.current = 0;
        }
      }, 500); // Increased from 300ms to 500ms for better stability
    }
    
    // Clean up timeout on unmount
    return () => {
      if (redirectDebounceTimer.current) {
        clearTimeout(redirectDebounceTimer.current);
      }
    };
  }, [user, role, allowedRolesMemoized, authLoading, roleLoading, initialFetchComplete, location.pathname, redirectTo]);
  
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

  // If redirect evaluation determined we should redirect and we're not already on the redirect path
  if (shouldRedirect && !isOnRedirectPath()) {
    console.log(`${redirectReason}, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default RoleBasedRoute;
