
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import PaymentFormSection from '@/components/payment/PaymentFormSection';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const { 
    isSubmitting,
    clientSecret,
    processingPayment,
    handlePaymentSubmit 
  } = usePaymentProcess(linkId, linkData);

  // Redirect if link not found
  useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);

  if (isLoading) {
    return <PaymentPageLoading />;
  }

  // At this point, linkData should be available if it exists
  if (!linkData) {
    return null; // Will redirect via useEffect
  }

  const clinicData = linkData.clinic;
  const paymentType = linkData.title || 'Payment';
  const isStripeConnected = clinicData.stripeStatus === 'connected';

  // Prepare default values from payment request patient info
  const defaultValues = linkData?.isRequest ? {
    name: linkData.patientName || '',
    email: linkData.patientEmail || '',
    phone: linkData.patientPhone || '',
  } : undefined;

  return (
    <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
      {/* Left Column - Clinic Info & Security */}
      <div className="space-y-4">
        {clinicData && (
          <PaymentPageClinicCard clinic={{
            name: clinicData.name,
            logo: clinicData.logo || '',
            email: clinicData.email,
            phone: clinicData.phone,
            address: clinicData.address,
            paymentType: paymentType,
            amount: linkData.amount
          }} />
        )}
        <CliniPaySecuritySection />
      </div>
      
      {/* Right Column - Payment Form */}
      <PaymentFormSection 
        isStripeConnected={isStripeConnected}
        clientSecret={clientSecret}
        processingPayment={processingPayment}
        isSubmitting={isSubmitting}
        defaultValues={defaultValues}
        onSubmit={handlePaymentSubmit}
      />
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
