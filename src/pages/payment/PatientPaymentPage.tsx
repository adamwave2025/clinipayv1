
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { toast } from 'sonner';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const [initError, setInitError] = useState<string | null>(errorParam);

  // Redirect if link not found
  useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      console.error("Payment link error:", error);
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);
  
  // Handle global errors by redirecting to failed page
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Unhandled payment error:", event.error);
      toast.error("An unexpected error occurred");
      
      // Prevent redirect loops by checking if we're already on the failed page
      if (!window.location.pathname.includes('/payment/failed')) {
        navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
      }
      
      // Prevent the default handler
      event.preventDefault();
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [navigate, linkId]);

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
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/payment/failed')}
            className="text-blue-600 hover:underline"
          >
            Go to payment failed page
          </button>
        </div>
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
  const navigate = useNavigate();

  const {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit
  } = usePaymentProcess(linkId, linkData);
  
  // Error boundary for payment form
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) {
      navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
    }
  }, [hasError, navigate, linkId]);

  const handlePaymentWithErrorCatch = async (formData: PaymentFormValues) => {
    try {
      await handlePaymentSubmit(formData);
    } catch (error) {
      console.error("Payment form error:", error);
      setHasError(true);
    }
  };

  return (
    <PaymentFormSection 
      isStripeConnected={isStripeConnected}
      processingPayment={processingPayment}
      isSubmitting={isSubmitting}
      defaultValues={defaultValues}
      onSubmit={handlePaymentWithErrorCatch}
    />
  );
};

export default PatientPaymentPage;
