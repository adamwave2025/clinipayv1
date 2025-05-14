
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AdminRedirectProps {
  fallbackComponent: React.ReactNode;
}

/**
 * Enhanced Admin Redirect component that uses the unified auth context
 * Redirects to admin dashboard if user is an admin, otherwise shows fallback
 */
const AdminRedirect: React.FC<AdminRedirectProps> = ({ fallbackComponent }) => {
  const { isFullyLoaded, role, isLoading } = useUnifiedAuth();
  
  console.log('[ADMIN REDIRECT]', { isFullyLoaded, role, isLoading });
  
  // Show loading while we determine auth state
  if (isLoading || !isFullyLoaded) {
    console.log('[ADMIN REDIRECT] Auth data still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (role === 'admin') {
    console.log('[ADMIN REDIRECT] User is admin, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  // For non-admin users, show the fallback component
  console.log('[ADMIN REDIRECT] User is not admin, showing fallback');
  return <>{fallbackComponent}</>;
};

export default AdminRedirect;
