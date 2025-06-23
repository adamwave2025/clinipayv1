
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentSettingsProps {
  stripeAccountId: string | null;
  stripeStatus: string | null;
  handleConnectStripe: () => void;
  handleDisconnectStripe: () => void;
}

const PaymentSettings = ({ 
  stripeAccountId, 
  stripeStatus,
  handleConnectStripe, 
  handleDisconnectStripe 
}: PaymentSettingsProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const isConnected = stripeStatus === 'connected';
  const isPending = stripeStatus === 'pending';

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
    if (isConnected) {
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex-1">
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
            <div className="flex-shrink-0 w-full sm:w-auto">
              {isConnected || isPending ? (
                <Button 
                  onClick={handleDisconnectStripe} 
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 w-full sm:w-auto"
                >
                  <span className="sm:hidden">Disconnect</span>
                  <span className="hidden sm:inline">Disconnect Stripe</span>
                </Button>
              ) : (
                <Button 
                  onClick={startStripeConnect} 
                  className="btn-gradient w-full sm:w-auto"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
