
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthLayout from '@/components/layouts/AuthLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for query params first (used for Stripe connect)
      const queryParams = new URLSearchParams(window.location.search);
      const type = queryParams.get('type');
      
      if (type === 'stripe_connect') {
        await handleStripeConnect();
        return;
      }
      
      // If not a Stripe callback, handle regular auth callback
      // Get the URL hash and parse it
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const authType = hashParams.get('type');
      
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
          
          console.log('Auth callback successful, type:', authType);
          
          // Redirect based on the type of callback
          if (authType === 'signup') {
            navigate('/dashboard');
          } else if (authType === 'recovery') {
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
    
    const handleStripeConnect = async () => {
      try {
        // Get the current user's session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('You must be logged in to connect Stripe');
          navigate('/sign-in');
          return;
        }
        
        // Call the retrieve-account-id edge function to get the account ID
        const { data, error } = await supabase.functions.invoke('connect-onboarding', {
          body: { action: 'retrieve_account_id' }
        });
        
        if (error) {
          throw error;
        }
        
        if (data?.accountId) {
          // Update clinic data with the Stripe account ID
          const { error: updateError } = await supabase
            .from('clinics')
            .update({ stripe_account_id: data.accountId })
            .eq('id', data.clinicId);
            
          if (updateError) {
            throw updateError;
          }
          
          toast.success('Successfully connected to Stripe');
        } else {
          toast.error('Failed to retrieve Stripe account ID');
        }
        
        // Redirect to settings page with the payments tab selected and stripe_connected flag
        navigate('/dashboard/settings?tab=payments&stripe_connected=true');
      } catch (err: any) {
        console.error('Error handling Stripe connect callback:', err);
        setError(err.message || 'An error occurred during Stripe connection');
        toast.error(`Failed to connect Stripe: ${err.message || 'Unknown error'}`);
        // Still redirect to settings page so user can try again
        navigate('/dashboard/settings?tab=payments');
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
