
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentSettingsProps {
  handleConnectStripe: () => void;
}

const PaymentSettings = ({ handleConnectStripe }: PaymentSettingsProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Payment Processing</h3>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Stripe Connect</h4>
              <p className="text-sm text-gray-500">Status: Not Connected</p>
            </div>
            <Button onClick={handleConnectStripe} className="btn-gradient">
              Connect Stripe
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
