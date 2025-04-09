
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';

const PaymentSuccessPage = () => {
  // Mock payment details
  const paymentDetails = {
    amount: 75.00,
    clinic: 'Greenfield Medical Clinic',
    paymentType: 'Consultation Deposit',
    date: new Date().toLocaleDateString(),
    reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  };

  // Mock clinic details - similar to PatientPaymentPage
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    logo: '',
    email: 'contact@greenfieldclinic.com',
    phone: '+44 20 7123 4567',
    address: '123 Harley Street, London, W1G 7JU',
    paymentType: 'Consultation Deposit',
    amount: 75.00,
  };

  const details = [
    { label: 'Amount Paid', value: paymentDetails.amount },
    { label: 'Date', value: paymentDetails.date },
    { label: 'Clinic', value: paymentDetails.clinic },
    { label: 'Payment Type', value: paymentDetails.paymentType },
    { label: 'Reference', value: paymentDetails.reference, colSpan: 2 },
  ];

  return (
    <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
      {/* Left Column - Payment Status */}
      <div>
        <PaymentStatusSummary
          status="success"
          title="Payment Successful!"
          description="Your payment has been processed successfully. A confirmation email has been sent to your email address."
        />
        
        <PaymentDetailsCard details={details} />
      </div>
      
      {/* Right Column - Clinic Info */}
      <div>
        <PaymentPageClinicCard clinic={clinicDetails} />
      </div>
    </PaymentLayout>
  );
};

export default PaymentSuccessPage;
