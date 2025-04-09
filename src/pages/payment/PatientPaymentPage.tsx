
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { Card, CardContent } from '@/components/ui/card';
import { clinicDetails } from '@/data/clinicData';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentSubmit = (formData: PaymentFormValues) => {
    setIsLoading(true);
    
    // Mock payment processing
    setTimeout(() => {
      setIsLoading(false);
      navigate('/payment/success');
    }, 2000);
  };

  return (
    <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
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
        </CardContent>
      </Card>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
