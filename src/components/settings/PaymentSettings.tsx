
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [localStripeStatus, setLocalStripeStatus] = useState(stripeStatus);
  const isConnected = localStripeStatus === 'connected';
  const isPending = localStripeStatus === 'pending' || localStripeStatus === 'pending_verification';
  const isReviewPending = localStripeStatus === 'review_pending';

  // Update local state when props change
  useEffect(() => {
    setLocalStripeStatus(stripeStatus);
  }, [stripeStatus]);

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

  // Function to verify Stripe account status
  const verifyStripeStatus = async () => {
    if (!stripeAccountId) return;
    
    try {
      setIsVerifying(true);
      const { data, error } = await supabase.functions.invoke('connect-onboarding', {
        body: { action: 'check_account_status', accountId: stripeAccountId }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.status) {
        setLocalStripeStatus(data.status);
        
        if (data.status === 'connected') {
          toast.success('Your Stripe account is fully connected and ready to process payments!');
        } else if (data.status === 'pending_verification') {
          toast.info('Your Stripe account is pending verification from Stripe.');
        } else if (data.status === 'review_pending') {
          toast.info('Your Stripe account requires additional information. Please complete the Stripe onboarding process.');
        } else {
          toast.info(`Stripe status: ${data.status}. You may need to complete the onboarding process.`);
        }
        
        // If status has changed, update in the database
        if (data.status !== stripeStatus) {
          const { error: updateError } = await supabase
            .from('clinics')
            .update({ stripe_status: data.status })
            .eq('stripe_account_id', stripeAccountId);
            
          if (updateError) {
            console.error('Error updating stripe status:', updateError);
          }
        }
      } else {
        toast.error('Unable to verify Stripe status');
      }
    } catch (error: any) {
      console.error('Error verifying Stripe status:', error);
      toast.error(`Failed to verify Stripe status: ${error.message || 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
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
    } else if (isReviewPending) {
      return (
        <span className="inline-flex items-center text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Review Pending
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
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Stripe Connect</h4>
                <div className="flex items-center mt-1">
                  {getStatusDisplay()}
                  {(isPending || isReviewPending || isConnected) && (
                    <span className="text-xs text-gray-500 ml-2">ID: {stripeAccountId}</span>
                  )}
                  {(isPending || isReviewPending) && stripeAccountId && (
                    <Button 
                      onClick={verifyStripeStatus} 
                      variant="ghost" 
                      size="sm"
                      className="p-0 ml-2"
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <LoadingSpinner size="sm" className="text-amber-600" />
                      ) : (
                        <RefreshCw className="h-3 w-3 text-amber-600" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {isConnected || isPending || isReviewPending ? (
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
            
            {isPending && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Complete Stripe onboarding</p>
                    <p className="text-sm mt-1">
                      Your Stripe account setup is incomplete. Please complete the onboarding process 
                      with Stripe to enable payment processing.
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Button 
                        onClick={startStripeConnect} 
                        size="sm" 
                        variant="secondary"
                        className="bg-amber-100 hover:bg-amber-200 border-amber-200"
                      >
                        Complete Onboarding
                      </Button>
                      <Button 
                        onClick={verifyStripeStatus} 
                        size="sm" 
                        variant="outline"
                        disabled={isVerifying}
                        className="border-amber-200"
                      >
                        {isVerifying ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-1" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Verify Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {isReviewPending && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Account Under Review</p>
                    <p className="text-sm mt-1">
                      Your Stripe account is under review. Stripe may require additional information 
                      to activate your account.
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Button 
                        onClick={startStripeConnect} 
                        size="sm" 
                        variant="secondary"
                        className="bg-amber-100 hover:bg-amber-200 border-amber-200"
                      >
                        Complete Requirements
                      </Button>
                      <Button 
                        onClick={verifyStripeStatus} 
                        size="sm" 
                        variant="outline"
                        disabled={isVerifying}
                        className="border-amber-200"
                      >
                        {isVerifying ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-1" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Verify Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {isConnected && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Successfully Connected</p>
                    <p className="text-sm mt-1">
                      Your Stripe account is fully set up and ready to process payments.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
