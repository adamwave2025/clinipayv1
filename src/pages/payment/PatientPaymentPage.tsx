
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { Card, CardContent } from '@/components/ui/card';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading: isLoadingLink, error } = usePaymentLinkData(linkId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) return;
    
    setIsSubmitting(true);
    
    try {
      // Store phone number as text to preserve leading zeros
      const phoneNumber = formData.phone ? formData.phone.replace(/\D/g, '') : null;
      
      // Create a payment record
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.id,
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: phoneNumber,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Navigate to success page with the link_id parameter
      navigate(`/payment/success?link_id=${linkId}&payment_id=${data[0].id}`);
    } catch (error) {
      console.error('Payment error:', error);
      navigate('/payment/failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if link not found
  useEffect(() => {
    if (!isLoadingLink && (error || !linkData)) {
      navigate('/payment/failed');
    }
  }, [isLoadingLink, error, linkData, navigate]);

  if (isLoadingLink) {
    return (
      <PaymentLayout isSplitView={false} hideHeaderFooter={false}>
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner size="lg" />
          <p className="ml-3 text-gray-600">Loading payment information...</p>
        </div>
      </PaymentLayout>
    );
  }

  if (!linkData) {
    return null; // Will redirect via useEffect
  }

  return (
    <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
      {/* Left Column - Clinic Info & Security */}
      <div className="space-y-4">
        <PaymentPageClinicCard clinic={{
          name: linkData.clinic.name,
          logo: linkData.clinic.logo || '',
          email: linkData.clinic.email,
          phone: linkData.clinic.phone,
          address: linkData.clinic.address,
          paymentType: linkData.title,
          amount: linkData.amount
        }} />
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
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
