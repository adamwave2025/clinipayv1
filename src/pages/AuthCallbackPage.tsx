
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthLayout from '@/components/layouts/AuthLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the URL hash and parse it
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      if (accessToken && refreshToken) {
        try {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw error;
          }
          
          console.log('Auth callback successful, type:', type);
          
          // Redirect based on the type of callback
          if (type === 'signup') {
            navigate('/dashboard');
          } else if (type === 'recovery') {
            navigate('/reset-password');
          } else {
            navigate('/dashboard');
          }
        } catch (err: any) {
          console.error('Error handling auth callback:', err);
          setError(err.message || 'An error occurred during authentication');
        }
      } else {
        // If no tokens are present, check if this is an error
        const errorMessage = hashParams.get('error_description');
        if (errorMessage) {
          setError(decodeURIComponent(errorMessage));
        } else {
          // Not a valid callback URL, redirect to sign in
          navigate('/sign-in');
        }
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <AuthLayout title="Authentication Error" subtitle="There was a problem with authentication">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Completing Authentication" subtitle="Please wait while we complete the process">
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Finishing up your authentication...</p>
      </div>
    </AuthLayout>
  );
};

export default AuthCallbackPage;
