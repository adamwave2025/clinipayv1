
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AdminRedirectProps {
  fallbackComponent: React.ReactNode;
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ fallbackComponent }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Combined loading state
  const isLoading = authLoading || roleLoading;
  
  useEffect(() => {
    // Only determine if we should redirect after both auth and role are loaded
    if (!isLoading && role === 'admin') {
      console.log('AdminRedirect: User is admin, preparing to redirect');
      setShouldRedirect(true);
    }
  }, [role, isLoading]);
  
  // Enhanced logging
  console.log('AdminRedirect:', {
    authLoading,
    roleLoading,
    isLoading,
    role,
    shouldRedirect
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-muted-foreground">
          {authLoading ? "Verifying your account..." : "Checking user role..."}
        </p>
      </div>
    );
  }
  
  if (shouldRedirect) {
    console.log('AdminRedirect: Redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  console.log('AdminRedirect: User is not admin, showing fallback component');
  return <>{fallbackComponent}</>;
};

export default AdminRedirect;
