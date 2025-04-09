
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Once the auth state is loaded, we can stop checking
    if (!loading) {
      setIsChecking(false);
      
      // If user is authenticated but trying to access auth pages, redirect to dashboard
      const authPaths = ['/sign-in', '/sign-up', '/verify-email'];
      if (user && authPaths.includes(location.pathname)) {
        toast.info('You are already signed in');
      }
    }
  }, [loading, user, location.pathname]);

  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to the sign-in page if not authenticated
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
