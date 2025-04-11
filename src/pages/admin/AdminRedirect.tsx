
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AdminRedirectProps {
  fallbackComponent: React.ReactNode;
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ fallbackComponent }) => {
  const { role, loading } = useUserRole();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // After role is loaded, determine if we should redirect
    if (!loading && role === 'admin') {
      setShouldRedirect(true);
    }
  }, [role, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (shouldRedirect) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{fallbackComponent}</>;
};

export default AdminRedirect;
