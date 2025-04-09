
import React from 'react';
import { Shield, Lock } from 'lucide-react';

const PaymentSecurityInfo = () => {
  return (
    <div className="space-y-4 mt-6">
      <div className="text-center text-sm text-gray-500 flex items-center justify-center">
        <Lock className="h-4 w-4 mr-1 text-green-600" />
        Secure payment processed by CliniPay
      </div>
      
      <div className="space-y-3 mt-2">
        <div className="flex justify-center">
          <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Secure Payment
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSecurityInfo;
