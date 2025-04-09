
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, CheckCircle } from 'lucide-react';

const CliniPaySecuritySection = () => {
  return (
    <Card className="border-none shadow-none bg-white rounded-lg mt-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-800">Secure Payment with CliniPay</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                Your payment is processed securely with bank-level encryption. We never store your
                full card details.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                CliniPay is PCI DSS compliant, ensuring your payment data is handled according to the
                highest security standards in the industry.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                Your payment confirmation is sent immediately to both you and your healthcare provider.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <img src="https://cdn.gpteng.co/gptengineer.js/card-visa.svg" alt="Visa" className="h-8" />
          <img src="https://cdn.gpteng.co/gptengineer.js/card-mastercard.svg" alt="Mastercard" className="h-8" />
          <img src="https://cdn.gpteng.co/gptengineer.js/card-amex.svg" alt="American Express" className="h-8" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CliniPaySecuritySection;
