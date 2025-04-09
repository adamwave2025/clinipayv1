
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import { Building, Mail, Phone, MapPin } from 'lucide-react';

const PaymentFailedReasons = () => (
  <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
    <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
    <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
      <li>Insufficient funds in your account</li>
      <li>Card details entered incorrectly</li>
      <li>Card has expired or been cancelled</li>
      <li>Transaction was declined by your bank</li>
      <li>Temporary issue with payment processor</li>
    </ul>
  </div>
);

const PaymentFailedPage = () => {
  // Mock clinic details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    email: 'contact@greenfieldclinic.com',
    phone: '+44 20 7123 4567',
    address: '123 Harley Street, London, W1G 7JU',
  };

  return (
    <PaymentLayout>
      <PaymentStatusSummary
        status="failed"
        title="Payment Failed"
        description="Your payment could not be processed. Please check your payment details and try again."
      />
      
      <PaymentFailedReasons />
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          If you continue to experience issues, please contact the clinic directly.
        </p>
      </div>
      
      {/* Clinic Details */}
      <div className="mt-8 bg-white rounded-lg p-4 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Clinic Information</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-700 font-medium">{clinicDetails.name}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-700">{clinicDetails.address}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-700">{clinicDetails.email}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-700">{clinicDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </PaymentLayout>
  );
};

export default PaymentFailedPage;
