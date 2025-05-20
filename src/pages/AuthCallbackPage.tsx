
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthLayout from '@/components/layouts/AuthLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Finishing up your authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      setIsProcessing(true);
      
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
          setIsProcessing(false);
        }
      } else {
        // If no tokens are present, check if this is an error
        const errorMessage = hashParams.get('error_description');
        if (errorMessage) {
          setError(decodeURIComponent(errorMessage));
          setIsProcessing(false);
        } else {
          // Not a valid callback URL, redirect to sign in
          navigate('/sign-in');
        }
      }
    };
    
    const handleStripeConnect = async () => {
      try {
        setStatusMessage('Processing Stripe connection...');
        
        // Get the current user's session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('You must be logged in to connect Stripe');
          navigate('/sign-in');
          return;
        }
        
        // Call the retrieve-account-id edge function to get the account ID
        setStatusMessage('Retrieving Stripe account information...');
        const { data, error } = await supabase.functions.invoke('connect-onboarding', {
          body: { action: 'retrieve_account_id' }
        });
        
        if (error) {
          throw error;
        }
        
        if (data?.accountId) {
          // Check account status with Stripe with retry logic
          setStatusMessage('Verifying Stripe account status...');
          let statusData;
          let statusError;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            const response = await supabase.functions.invoke('connect-onboarding', {
              body: { action: 'check_account_status', accountId: data.accountId }
            });
            
            statusData = response.data;
            statusError = response.error;
            
            if (statusError) {
              console.error('Error checking stripe status:', statusError);
              retryCount++;
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (statusData?.status === 'connected') {
              // If the account is fully connected, break out of retry loop
              break;
            } else {
              retryCount++;
              // Wait 1 second before retrying if not yet connected
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Update clinic data with the Stripe account ID and status
          const stripeStatus = statusData?.status || 'pending';
          
          setStatusMessage(`Updating your payment settings (${stripeStatus})...`);
          const { error: updateError } = await supabase
            .from('clinics')
            .update({ 
              stripe_account_id: data.accountId,
              stripe_status: stripeStatus 
            })
            .eq('id', data.clinicId);
            
          if (updateError) {
            throw updateError;
          }
          
          if (stripeStatus === 'connected') {
            toast.success('Successfully connected to Stripe! Your account is ready to process payments.');
          } else if (stripeStatus === 'pending_verification') {
            toast.info('Your Stripe account is pending verification. Check back soon or verify your account status.');
          } else {
            toast.info(`Your Stripe connection is ${stripeStatus}. You may need to complete additional steps in the settings.`);
          }
        } else {
          toast.error('Failed to retrieve Stripe account ID');
        }
        
        // Redirect to settings page with the payments tab selected
        navigate('/dashboard/settings?tab=payments');
      } catch (err: any) {
        console.error('Error handling Stripe connect callback:', err);
        setError(err.message || 'An error occurred during Stripe connection');
        toast.error(`Failed to connect Stripe: ${err.message || 'Unknown error'}`);
        // Still redirect to settings page so user can try again
        navigate('/dashboard/settings?tab=payments');
      } finally {
        setIsProcessing(false);
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
        <p className="mt-4 text-gray-600">{statusMessage}</p>
      </div>
    </AuthLayout>
  );
};

export default AuthCallbackPage;
