
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { verifyStripeConnectionStatus } from '@/utils/stripe-connection-utils';

interface PaymentSettingsProps {
  stripeAccountId: string | null;
  stripeStatus: string | null;
  handleConnectStripe: () => void;
  handleDisconnectStripe: () => void;
}

const PaymentSettings = ({ 
  stripeAccountId, 
  stripeStatus: initialStripeStatus,
  handleConnectStripe, 
  handleDisconnectStripe 
}: PaymentSettingsProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(initialStripeStatus);
  
  const isConnected = stripeStatus === 'connected';
  const isPending = stripeStatus === 'pending';

  // Verify Stripe status when component mounts or stripeAccountId changes
  useEffect(() => {
    if (stripeAccountId) {
      verifyStatus();
    }
  }, [stripeAccountId]);

  const verifyStatus = async () => {
    try {
      setIsVerifying(true);
      
      // Get the clinic ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', session.user.id)
        .single();
      
      if (!userData?.clinic_id) return;
      
      // Verify the Stripe connection status
      const result = await verifyStripeConnectionStatus(userData.clinic_id);
      
      if (result.success) {
        setStripeStatus(result.status);
        
        // If status changed from what we initially had, show a toast
        if (result.status !== initialStripeStatus) {
          if (result.status === 'connected') {
            toast.success('Your Stripe account is now fully connected!');
          } else if (result.status === 'pending') {
            toast.info('Please complete the Stripe onboarding process to enable payments');
          }
        }
      }
    } catch (error) {
      console.error('Error verifying Stripe status:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const startStripeConnect = async () => {
    try {
      setIsConnecting(true);
      const { data, error } = await supabase.functions.invoke('connect-onboarding', {
        body: { returnUrl: window.location.origin + '/auth/callback?type=stripe_connect' }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      } else {
        toast.error('Failed to get Stripe onboarding URL');
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error('Error connecting to Stripe:', error);
      toast.error(`Failed to connect to Stripe: ${error.message || 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  const getStatusDisplay = () => {
    if (isVerifying) {
      return (
        <span className="inline-flex items-center text-sm text-blue-600">
          <LoadingSpinner size="sm" className="mr-1" />
          Verifying...
        </span>
      );
    } else if (isConnected) {
      return (
        <span className="inline-flex items-center text-sm text-green-600">
          <Check className="h-4 w-4 mr-1" />
          Connected
        </span>
      );
    } else if (isPending) {
      return (
        <span className="inline-flex items-center text-sm text-amber-600">
          <Clock className="h-4 w-4 mr-1" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center text-sm text-gray-500">
          <X className="h-4 w-4 mr-1" />
          Not Connected
        </span>
      );
    }
  };

  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Payment Processing</h3>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Stripe Connect</h4>
              <div className="flex items-center mt-1">
                {getStatusDisplay()}
                {(isConnected || isPending) && (
                  <span className="text-xs text-gray-500 ml-2">ID: {stripeAccountId}</span>
                )}
              </div>
              {isPending && (
                <p className="text-xs text-amber-600 mt-1">
                  Please complete the Stripe onboarding process to enable payments
                </p>
              )}
            </div>
            {isConnected || isPending ? (
              <Button 
                onClick={handleDisconnectStripe} 
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Disconnect Stripe
              </Button>
            ) : (
              <Button 
                onClick={startStripeConnect} 
                className="btn-gradient"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Stripe'
                )}
              </Button>
            )}
          </div>
          
          {(isConnected || isPending) && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={verifyStatus}
                disabled={isVerifying}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    Verifying...
                  </>
                ) : (
                  'Verify Connection Status'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
