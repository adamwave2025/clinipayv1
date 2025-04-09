
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface PaymentSettingsProps {
  stripeAccountId: string | null;
  handleConnectStripe: () => void;
  handleDisconnectStripe: () => void;
}

const PaymentSettings = ({ 
  stripeAccountId, 
  handleConnectStripe, 
  handleDisconnectStripe 
}: PaymentSettingsProps) => {
  const isConnected = !!stripeAccountId;

  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Payment Processing</h3>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Stripe Connect</h4>
              <div className="flex items-center mt-1">
                {isConnected ? (
                  <>
                    <span className="inline-flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Connected
                    </span>
                    <span className="text-xs text-gray-500 ml-2">ID: {stripeAccountId}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <X className="h-4 w-4 mr-1" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>
            {isConnected ? (
              <Button 
                onClick={handleDisconnectStripe} 
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Disconnect Stripe
              </Button>
            ) : (
              <Button 
                onClick={handleConnectStripe} 
                className="btn-gradient"
              >
                Connect Stripe
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
