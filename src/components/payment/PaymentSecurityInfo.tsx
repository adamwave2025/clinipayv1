
import React from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';

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
    </div>
  );
};

export default PaymentSecurityInfo;
