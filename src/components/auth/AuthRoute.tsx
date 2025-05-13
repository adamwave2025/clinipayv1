
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AuthRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Base route protection component that ensures the user is authenticated
 * Shows loading UI while authentication status is being determined
 */
export const AuthRoute: React.FC<AuthRouteProps> = ({ 
  children, 
  redirectTo = '/sign-in' 
}) => {
  const { 
    isAuthenticated,
    isFullyLoaded,
    isLoading,
    session,
    user
  } = useUnifiedAuth();
  
  const location = useLocation();

  // Log the current auth state for debugging
  console.log('[AUTH ROUTE]', { 
    path: location.pathname,
    isAuthenticated,
    isFullyLoaded,
    isLoading,
    hasSession: Boolean(session),
    hasUser: Boolean(user)
  });

  // Show loading while we determine auth state
  if (isLoading || !isFullyLoaded) {
    console.log('[AUTH ROUTE] Still loading auth state, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated and loading is complete, redirect to sign-in
  if (!isAuthenticated) {
    console.log('[AUTH ROUTE] User not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  console.log('[AUTH ROUTE] User authenticated, rendering protected content');
  return <>{children}</>;
};

export default AuthRoute;
