
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
  redirectTo: string;
}

/**
 * A wrapper component that redirects authenticated users to another page
 * This is useful for pages like login, signup, or home that should redirect
 * authenticated users to their dashboard
 * Now uses the unified auth context for improved reliability
 */
const AuthRedirectWrapper = ({ 
  children, 
  redirectTo 
}: AuthRedirectWrapperProps) => {
  const { isAuthenticated, isLoading, isFullyLoaded } = useUnifiedAuth();
  const navigate = useNavigate();

  console.log('[AUTH REDIRECT]', { isAuthenticated, isLoading, isFullyLoaded, redirectTo });

  useEffect(() => {
    // Only redirect when we're sure about the auth state
    if (!isLoading && isFullyLoaded && isAuthenticated) {
      console.log('[AUTH REDIRECT] Redirecting authenticated user to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, isFullyLoaded, navigate, redirectTo]);

  // Show loading spinner while checking auth state
  if (isLoading || !isFullyLoaded) {
    console.log('[AUTH REDIRECT] Auth state loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Only render children if user is not authenticated
  console.log('[AUTH REDIRECT] User not authenticated, showing children');
  return isAuthenticated ? null : <>{children}</>;
};

export default AuthRedirectWrapper;
