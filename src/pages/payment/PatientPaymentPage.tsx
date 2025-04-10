
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import PaymentFormSection from '@/components/payment/PaymentFormSection';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key from Supabase environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OgHYeEXQXA8Yw4lPwEiRXfBg5MCGN8Ri3aELhMOgYm1YyY6SeBwsJcEvL6GZ7fhitWDIyHjRsZ4s3lw2tJgPnzq00dBEHEp2C');

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);

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

  // We need to wrap the whole component in Elements provider
  return (
    <Elements stripe={stripePromise}>
      <PaymentPageContent 
        linkId={linkId}
        linkData={linkData}
        clinicData={clinicData}
        paymentType={paymentType}
        isStripeConnected={isStripeConnected}
        defaultValues={defaultValues}
      />
    </Elements>
  );
};

// Extract inner content to use usePaymentProcess hook inside Elements provider
const PaymentPageContent = ({ 
  linkId, 
  linkData, 
  clinicData, 
  paymentType, 
  isStripeConnected,
  defaultValues 
}) => {
  const { 
    isSubmitting,
    clientSecret,
    processingPayment,
    handlePaymentSubmit 
  } = usePaymentProcess(linkId, linkData);

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
