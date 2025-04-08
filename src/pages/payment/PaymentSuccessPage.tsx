
import React from 'react';
import { Button } from '@/components/ui/button';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';

const PaymentSuccessPage = () => {
  // Mock payment details
  const paymentDetails = {
    amount: 75.00,
    clinic: 'Greenfield Medical Clinic',
    paymentType: 'Consultation Deposit',
    date: new Date().toLocaleDateString(),
    reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  };

  const details = [
    { label: 'Amount Paid', value: paymentDetails.amount },
    { label: 'Date', value: paymentDetails.date },
    { label: 'Clinic', value: paymentDetails.clinic },
    { label: 'Payment Type', value: paymentDetails.paymentType },
    { label: 'Reference', value: paymentDetails.reference, colSpan: 2 },
  ];

  return (
    <PaymentLayout>
      <PaymentStatusSummary
        status="success"
        title="Payment Successful!"
        description="Your payment has been processed successfully. A confirmation email has been sent to your email address."
        primaryActionLabel="Download Receipt"
        secondaryActionLabel="Close"
        onPrimaryAction={() => {/* Download receipt logic */}}
        onSecondaryAction={() => window.close()}
      />
      
      <PaymentDetailsCard details={details} />
    </PaymentLayout>
  );
};

export default PaymentSuccessPage;
