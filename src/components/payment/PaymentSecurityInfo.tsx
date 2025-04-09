
import React from 'react';
import { Check, Lock } from 'lucide-react';

const PaymentSecurityInfo = () => {
  return (
    <>
      <div className="text-center text-sm text-gray-500 flex items-center justify-center mt-6">
        <Lock className="h-4 w-4 mr-1" />
        Secure payment processed by CliniPay
      </div>
      
      <div className="mt-8 text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Check className="h-4 w-4 text-green-500" />
          <span>Your payment is secure and encrypted</span>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <img src="https://cdn.gpteng.co/gptengineer.js/card-visa.svg" alt="Visa" className="h-6" />
          <img src="https://cdn.gpteng.co/gptengineer.js/card-mastercard.svg" alt="Mastercard" className="h-6" />
          <img src="https://cdn.gpteng.co/gptengineer.js/card-amex.svg" alt="American Express" className="h-6" />
        </div>
      </div>
    </>
  );
};

export default PaymentSecurityInfo;
