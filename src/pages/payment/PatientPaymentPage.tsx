
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import PaymentFormSection from '@/components/payment/PaymentFormSection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import StripeProvider from '@/components/payment/StripeProvider';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const [initError, setInitError] = useState<string | null>(null);

  // Redirect if link not found
  React.useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      console.error("Payment link error:", error);
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);

  if (isLoading) {
    return <PaymentPageLoading />;
  }

  if (initError) {
    return (
      <PaymentLayout hideHeaderFooter={true}>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Error</AlertTitle>
          <AlertDescription>{initError}</AlertDescription>
        </Alert>
      </PaymentLayout>
    );
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
      <StripeProvider>
        <PaymentFormContainer 
          linkId={linkId}
          linkData={linkData}
          isStripeConnected={isStripeConnected}
          defaultValues={defaultValues}
        />
      </StripeProvider>
    </PaymentLayout>
  );
};

// Extract inner content to use Stripe payment process
const PaymentFormContainer = ({ 
  linkId, 
  linkData, 
  isStripeConnected, 
  defaultValues 
}) => {
  const {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit
  } = usePaymentProcess(linkId, linkData);

  return (
    <PaymentFormSection 
      isStripeConnected={isStripeConnected}
      processingPayment={processingPayment}
      isSubmitting={isSubmitting}
      defaultValues={defaultValues}
      onSubmit={handlePaymentSubmit}
    />
  );
};

export default PatientPaymentPage;
