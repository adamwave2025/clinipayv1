
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import { Building, Mail, Phone, MapPin } from 'lucide-react';

const PaymentSuccessPage = () => {
  // Mock payment details
  const paymentDetails = {
    amount: 75.00,
    clinic: 'Greenfield Medical Clinic',
    paymentType: 'Consultation Deposit',
    date: new Date().toLocaleDateString(),
    reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  };

  // Mock clinic details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    email: 'contact@greenfieldclinic.com',
    phone: '+44 20 7123 4567',
    address: '123 Harley Street, London, W1G 7JU',
  };

  const details = [
    { label: 'Amount Paid', value: paymentDetails.amount },
    { label: 'Date', value: paymentDetails.date },
    { label: 'Clinic', value: paymentDetails.clinic },
    { label: 'Payment Type', value: paymentDetails.paymentType },
    { label: 'Reference', value: paymentDetails.reference, colSpan: 2 },
  ];

  return (
    <PaymentLayout hideHeaderFooter={true}>
      <PaymentStatusSummary
        status="success"
        title="Payment Successful!"
        description="Your payment has been processed successfully. A confirmation email has been sent to your email address."
      />
      
      <PaymentDetailsCard details={details} />
      
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

export default PaymentSuccessPage;
