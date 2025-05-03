
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
  redirectTo: string;
}

/**
 * A wrapper component that redirects authenticated users to another page
 * This is useful for pages like login, signup, or home that should redirect
 * authenticated users to their dashboard
 */
const AuthRedirectWrapper = ({ 
  children, 
  redirectTo 
}: AuthRedirectWrapperProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, redirect them
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only render children if user is not authenticated
  return user ? null : <>{children}</>;
};

export default AuthRedirectWrapper;
