
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import ClinicInformationCard from '@/components/payment/ClinicInformationCard';
import { clinicDetails, generatePaymentDetails } from '@/data/clinicData';

const PaymentSuccessPage = () => {
  // Generate payment details
  const paymentDetails = generatePaymentDetails();

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
      
      <ClinicInformationCard clinicDetails={clinicDetails} />
    </PaymentLayout>
  );
};

export default PaymentSuccessPage;
