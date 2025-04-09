
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentSummary from '@/components/payment/PaymentSummary';
import PaymentSecurityInfo from '@/components/payment/PaymentSecurityInfo';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock clinic and payment details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    logo: '',
    paymentType: 'Consultation Deposit',
    amount: 75.00,
  };

  const handlePaymentSubmit = (formData: PaymentFormValues) => {
    setIsLoading(true);
    
    // Mock payment processing
    setTimeout(() => {
      setIsLoading(false);
      navigate('/payment/success');
    }, 2000);
  };

  return (
    <PaymentLayout>
      <PaymentSummary 
        clinic={{
          name: clinicDetails.name,
          logo: clinicDetails.logo
        }}
        paymentType={clinicDetails.paymentType}
        amount={clinicDetails.amount}
      />
      
      <PaymentForm 
        onSubmit={handlePaymentSubmit}
        isLoading={isLoading}
      />
      
      <PaymentSecurityInfo />
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
