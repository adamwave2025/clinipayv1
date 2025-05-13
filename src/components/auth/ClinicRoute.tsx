
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ClinicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Clinic-specific route protection component
 * Ensures user is authenticated and has an associated clinic
 */
export const ClinicRoute: React.FC<ClinicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard'
}) => {
  const { 
    isAuthenticated,
    isFullyLoaded,
    isLoading,
    role,
    clinicId,
    debugState
  } = useUnifiedAuth();
  
  const location = useLocation();

  // Log the current state for debugging
  console.log('[CLINIC ROUTE]', { 
    path: location.pathname,
    userRole: role,
    clinicId,
    isAuthenticated,
    isFullyLoaded,
    ...debugState
  });

  // Show loading while we determine auth state
  if (isLoading || !isFullyLoaded) {
    console.log('[CLINIC ROUTE] Auth data still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    console.log('[CLINIC ROUTE] User not authenticated, redirecting to sign-in');
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check for clinic ID
  if (!clinicId) {
    console.log('[CLINIC ROUTE] No clinic ID found, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if authenticated and clinic ID is available
  console.log('[CLINIC ROUTE] Access granted for clinic:', clinicId);
  return <>{children}</>;
};

export default ClinicRoute;
