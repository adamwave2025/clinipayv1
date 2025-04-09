
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
        
        <div className="space-y-3 mt-6">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <span className="text-gray-700 font-medium">PCI DSS Compliant</span>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg text-center">
              <Lock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <span className="text-gray-700 font-medium">Bank-level Security</span>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg text-center">
              <Shield className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
              <span className="text-gray-700 font-medium">Instant Confirmation</span>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-green-50 p-2 rounded-lg text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
              <span className="text-gray-700 font-medium">Trusted by NHS Clinics</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CliniPaySecuritySection;
