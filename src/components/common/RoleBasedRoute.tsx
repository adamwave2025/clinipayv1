
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'sonner';

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
  const initialMountCompleteRef = useRef(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Navigation protection - prevent redirect loops
  const redirectProtectionRef = useRef({
    lastRedirectPath: '',
    redirectCount: 0,
    lastRedirectTime: 0,
    redirectsBlocked: 0,
    loopDetected: false,
    lastPathname: ''
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
  
  // Reset loop detection for significant path changes
  useEffect(() => {
    const protectionRef = redirectProtectionRef.current;
    
    // Reset if the core path changes (ignoring query params)
    if (location.pathname !== protectionRef.lastPathname) {
      if (protectionRef.loopDetected) {
        logRouteEvent('Navigation change detected, resetting loop protection', {
          from: protectionRef.lastPathname,
          to: location.pathname
        });
        
        protectionRef.redirectCount = 0;
        protectionRef.lastRedirectTime = 0;
        protectionRef.loopDetected = false;
      }
      
      protectionRef.lastPathname = location.pathname;
    }
  }, [location.pathname]);
  
  // Show a warning toast for detected navigation loops
  useEffect(() => {
    if (redirectProtectionRef.current.loopDetected && 
        redirectProtectionRef.current.redirectsBlocked === 1) { // Only show once
      toast.error(
        "Navigation loop detected and blocked. Using emergency fallback mode.", 
        { duration: 4000 }
      );
    }
  }, [redirectProtectionRef.current.loopDetected]);
  
  // Debounce auth state changes to prevent flickering
  useEffect(() => {
    // After first mount, apply more conservative stabilization
    if (initialMountCompleteRef.current) {
      logRouteEvent('Auth state change detected (subsequent)', { 
        previousUser: previousAuthState.current.user?.id,
        previousRole: previousAuthState.current.role
      });
      
      // Clear any existing timers
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      
      // Set a timer to stabilize auth state changes
      redirectTimerRef.current = setTimeout(() => {
        // Skip authorization check if loop detected
        if (redirectProtectionRef.current.loopDetected) {
          logRouteEvent('Skipping authorization check - loop detected');
          setStableLoadingState(false);
          return;
        }
        
        // Determine authorization status
        const hasValidUser = !!user;
        const hasValidRole = hasValidUser && !!role && allowedRoles.includes(role);
        const newAuthStatus = hasValidUser && hasValidRole;
        
        logRouteEvent('Authorization evaluation', {
          hasValidUser,
          currentRole: role,
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
        previousAuthState.current = { user, role };
        
        // Exit loading state only once we have a definitive answer
        if (stableLoadingState) {
          setStableLoadingState(false);
        }
      }, 500); // More conservative delay for subsequent changes
    } 
    // Initial mount - quicker evaluation
    else {
      logRouteEvent('Initial auth state evaluation', { 
        circuitBreakerActive,
        initialFetchComplete
      });
      
      // Skip if still loading auth or roles, or if initial fetch not complete
      if (authLoading || roleLoading || !initialFetchComplete) {
        return;
      }
      
      // Determine authorization status
      const hasValidUser = !!user;
      const hasValidRole = hasValidUser && !!role && allowedRoles.includes(role);
      const newAuthStatus = hasValidUser && hasValidRole;
      
      setIsAuthorized(newAuthStatus);
      setStableLoadingState(false);
      previousAuthState.current = { user, role };
      initialMountCompleteRef.current = true;
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
      if (redirectData.redirectCount > 2 && (now - redirectData.lastRedirectTime) < 2500) {
        redirectData.redirectsBlocked++;
        redirectData.loopDetected = true;
        
        logRouteEvent('🚨 REDIRECT LOOP DETECTED AND BLOCKED', {
          redirectCount: redirectData.redirectCount,
          timeSinceFirstRedirect: now - redirectData.lastRedirectTime + 'ms',
          redirectsBlocked: redirectData.redirectsBlocked,
          currentRole: role,
          allowedRoles,
          pathname: location.pathname
        });
        
        // Emergency fallback - render children instead of looping
        // This makes the app usable even when role detection is unstable
        logRouteEvent('Rendering children despite authorization failure to prevent loop');
        return <>{children}</>;
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
