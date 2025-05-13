
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
  
  // Track stable state to prevent flicker
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [stableLoadingState, setStableLoadingState] = useState(true);
  const previousAuthState = useRef({ user, role });
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce auth state changes to prevent flickering
  useEffect(() => {
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
        
        // Only update if auth status changed
        if (isAuthorized !== newAuthStatus) {
          console.log(`Authorization status changed to: ${newAuthStatus ? 'authorized' : 'unauthorized'}`);
          console.log(`User: ${hasValidUser ? 'yes' : 'no'}, Role: ${currentRole}, Allowed: ${hasValidRole ? 'yes' : 'no'}`);
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
  }, [user, role, allowedRoles, authLoading, roleLoading, initialFetchComplete, isAuthorized, stableLoadingState]);

  // Show loading while checking auth state or role
  if (stableLoadingState || authLoading || roleLoading || !initialFetchComplete) {
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

  // If authorization determined and NOT authorized, redirect
  if (isAuthorized === false) {
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default RoleBasedRoute;
