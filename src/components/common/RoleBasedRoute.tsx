
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';

// Debug setting - can be enabled via localStorage
const DEBUG_ROUTES = localStorage.getItem('DEBUG_ROUTES') === 'true' || false;

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
  const { user, loading: authLoading, debugMode } = useAuth();
  const { role, loading: roleLoading, initialFetchComplete, circuitBreakerActive } = useUserRole();
  const location = useLocation();
  
  // Track stable state to prevent flicker
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [stableLoadingState, setStableLoadingState] = useState(true);
  const previousAuthState = useRef({ user, role });
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Navigation protection - prevent redirect loops
  const redirectProtectionRef = useRef({
    lastRedirectPath: '',
    redirectCount: 0,
    lastRedirectTime: 0,
    redirectsBlocked: 0
  });

  // Debug logging function
  const logRouteEvent = (action: string, details?: any) => {
    if (DEBUG_ROUTES || debugMode) {
      console.group(`🛣️ Route Event: ${action}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Path: ${location.pathname}`);
      console.log(`User: ${user?.id || 'none'}`);
      console.log(`Role: ${role || 'none'}`);
      console.log(`Allowed Roles: ${allowedRoles.join(', ')}`);
      console.log(`Auth Loading: ${authLoading}, Role Loading: ${roleLoading}`);
      console.log(`Is Authorized: ${isAuthorized === null ? 'unknown' : isAuthorized}`);
      if (details) console.log('Details:', details);
      console.groupEnd();
    }
  };
  
  // Debounce auth state changes to prevent flickering
  useEffect(() => {
    logRouteEvent('Auth state change detected', { 
      isInitialFetch: !initialFetchComplete,
      circuitBreakerActive,
      previousUser: previousAuthState.current.user?.id,
      previousRole: previousAuthState.current.role
    });
    
    // Only evaluate auth changes after loading is complete
    if (!authLoading && !roleLoading && initialFetchComplete) {
      // Clear any existing timers
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      
      // Set a timer to stabilize auth state changes
      redirectTimerRef.current = setTimeout(() => {
        // Capture current state for evaluation
        const currentUser = user;
        const currentRole = role;
        
        // Determine authorization status
        const hasValidUser = !!currentUser;
        const hasValidRole = hasValidUser && !!currentRole && allowedRoles.includes(currentRole);
        const newAuthStatus = hasValidUser && hasValidRole;
        
        logRouteEvent('Authorization evaluation', {
          hasValidUser,
          currentRole,
          hasValidRole,
          newAuthStatus,
          previousStatus: isAuthorized
        });
        
        // Only update if auth status changed
        if (isAuthorized !== newAuthStatus) {
          logRouteEvent(`Authorization status changed to: ${newAuthStatus ? 'authorized' : 'unauthorized'}`);
          setIsAuthorized(newAuthStatus);
        }
        
        // Update previous state for future comparison
        previousAuthState.current = { user: currentUser, role: currentRole };
        
        // Exit loading state only once we have a definitive answer
        if (stableLoadingState) {
          setStableLoadingState(false);
        }
      }, 300); // Add small delay for debouncing
    }
    
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [
    user, 
    role, 
    allowedRoles, 
    authLoading, 
    roleLoading, 
    initialFetchComplete, 
    isAuthorized,
    stableLoadingState,
    debugMode,
    circuitBreakerActive
  ]);

  // Show loading while checking auth state or role
  if (stableLoadingState || authLoading || roleLoading || !initialFetchComplete) {
    logRouteEvent('Showing loading state', { 
      stableLoadingState, 
      authLoading, 
      roleLoading, 
      initialFetchComplete 
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    logRouteEvent('User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If authorization determined and NOT authorized, redirect (with loop protection)
  if (isAuthorized === false) {
    const now = Date.now();
    const redirectData = redirectProtectionRef.current;
    
    // Check for potential redirect loop
    if (redirectTo === redirectData.lastRedirectPath) {
      redirectData.redirectCount++;
      
      // If redirecting to the same path too many times in a short period
      if (redirectData.redirectCount > 3 && (now - redirectData.lastRedirectTime) < 5000) {
        redirectData.redirectsBlocked++;
        
        logRouteEvent('🚨 REDIRECT LOOP DETECTED AND BLOCKED', {
          redirectCount: redirectData.redirectCount,
          timeSinceFirstRedirect: now - redirectData.lastRedirectTime + 'ms',
          redirectsBlocked: redirectData.redirectsBlocked,
          currentRole: role,
          allowedRoles
        });
        
        // Emergency fallback - show error instead of infinite loop
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-xl font-bold mb-4 text-red-600">
              Navigation Error Detected
            </h1>
            <p className="mb-4 text-gray-700">
              The application detected a navigation issue. Please try refreshing the page.
            </p>
            <p className="text-sm text-gray-500">
              If you continue to experience issues, please contact support.
              <br />
              Error details: Role authorization loop detected.
            </p>
          </div>
        );
      }
    } else {
      // Reset counter if redirecting to a different path
      redirectData.redirectCount = 1;
    }
    
    redirectData.lastRedirectPath = redirectTo;
    redirectData.lastRedirectTime = now;
    
    logRouteEvent('Not authorized, redirecting', { 
      currentPath: location.pathname, 
      redirectTo, 
      redirectCount: redirectData.redirectCount 
    });
    
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  logRouteEvent('Authorization checks passed, rendering children');
  return <>{children}</>;
};

export default RoleBasedRoute;
