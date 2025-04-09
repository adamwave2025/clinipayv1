
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import PaymentSecurityInfo from '@/components/payment/PaymentSecurityInfo';
import { Card, CardContent } from '@/components/ui/card';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock clinic and payment details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    logo: '',
    email: 'contact@greenfieldclinic.com',
    phone: '+44 20 7123 4567',
    address: '123 Harley Street, London, W1G 7JU',
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
    <PaymentLayout isSplitView={true}>
      {/* Left Column - Clinic Info & Security */}
      <div className="space-y-4">
        <PaymentPageClinicCard clinic={clinicDetails} />
        <CliniPaySecuritySection />
      </div>
      
      {/* Right Column - Payment Form */}
      <Card className="card-shadow h-full">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
            Complete Your Payment
          </h2>
          
          <PaymentForm 
            onSubmit={handlePaymentSubmit}
            isLoading={isLoading}
          />
          
          <PaymentSecurityInfo />
        </CardContent>
      </Card>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
