
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import StripeProvider from '@/components/payment/StripeProvider';
import PaymentFormContainer from '@/components/payment/PaymentFormContainer';
import PaymentErrorBoundary from '@/components/payment/PaymentErrorBoundary';
import PaymentStatusSummaryContent from '@/components/payment/PaymentStatusSummaryContent';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { usePaymentNavigation } from '@/hooks/usePaymentNavigation';
import { usePaymentInit } from '@/hooks/usePaymentInit';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/common/Logo';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId, errorParam, navigateToFailedPage } = usePaymentNavigation();
  const { linkData, isLoading, initError } = usePaymentInit(linkId, errorParam);
  const [isFetchingPayment, setIsFetchingPayment] = useState(false);
  const hasShownToastRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch the most recent payment for the current payment link
  // Kept for future use but not currently being used for redirects
  const fetchLatestPayment = async (paymentLinkId: string) => {
    setIsFetchingPayment(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('stripe_payment_id, payment_ref')
        .eq('payment_link_id', paymentLinkId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Using maybeSingle instead of single to prevent errors

      if (error) {
        console.error('Error fetching payment data:', error);
        return null;
      }
      
      return data?.stripe_payment_id || null;
    } catch (err) {
      console.error('Error fetching payment:', err);
      return null;
    } finally {
      setIsFetchingPayment(false);
    }
  };

  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading || isFetchingPayment) {
    return <PaymentPageLoading />;
  }

  if (initError) {
    return (
      <PaymentLayout hideHeaderFooter={true}>
        <PaymentErrorBoundary errorMessage={initError} linkId={linkId}>
          {/* Empty div as children to satisfy the type requirement */}
          <div></div>
        </PaymentErrorBoundary>
      </PaymentLayout>
    );
  }

  // At this point, linkData should be available if it exists
  if (!linkData) {
    return null; // Will redirect via useEffect in usePaymentInit
  }

  // Check if the payment link or request has been cancelled
  const isCancelled = linkData.status === 'cancelled';
  if (isCancelled) {
    console.log("Payment request is cancelled, showing cancelled message");
    return (
      <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
        {/* Left Column - Clinic Info & Security */}
        <div className="space-y-4">
          {linkData.clinic && (
            <PaymentPageClinicCard 
              clinic={{
                name: linkData.clinic.name,
                logo: linkData.clinic.logo || '',
                email: linkData.clinic.email,
                phone: linkData.clinic.phone,
                address: linkData.clinic.address,
                paymentType: linkData.title || 'Payment',
                amount: linkData.amount
              }}
              paymentPlan={!!linkData.paymentPlan}
              planTotalAmount={linkData.planTotalAmount}
              totalPaid={linkData.totalPaid}
              totalOutstanding={linkData.totalOutstanding}
            />
          )}
          <CliniPaySecuritySection />
        </div>
        
        {/* Right Column - Cancellation Message */}
        <div className="bg-white p-6 rounded-lg border border-amber-100">
          <div className="flex justify-center mb-4">
            <Logo className="h-10" />
          </div>
          
          <div className="text-center">
            <div className="bg-amber-50 p-6 rounded-lg mb-6">
              <PaymentStatusSummaryContent
                status="pending"
                title="Payment No Longer Available"
                description="This payment link has been cancelled or rescheduled by the clinic. Please contact them directly for further information about your appointment or treatment."
              />
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact the clinic using the information provided.
            </p>
          </div>
        </div>
      </PaymentLayout>
    );
  }

  const clinicData = linkData.clinic;
  const paymentType = linkData.title || 'Payment';
  const isStripeConnected = clinicData.stripeStatus === 'connected';

  // Extract payment plan data if available
  const isPaymentPlan = !!linkData.paymentPlan;
  const planTotalAmount = linkData.planTotalAmount;
  const totalPaid = linkData.totalPaid || 0;
  const totalOutstanding = linkData.totalOutstanding || 0;

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
          <PaymentPageClinicCard 
            clinic={{
              name: clinicData.name,
              logo: clinicData.logo || '',
              email: clinicData.email,
              phone: clinicData.phone,
              address: clinicData.address,
              paymentType: paymentType,
              amount: linkData.amount
            }}
            paymentPlan={isPaymentPlan}
            planTotalAmount={planTotalAmount}
            totalPaid={totalPaid}
            totalOutstanding={totalOutstanding}
          />
        )}
        <CliniPaySecuritySection />
      </div>
      
      {/* Right Column - Payment Form */}
      <PaymentErrorBoundary linkId={linkId}>
        <StripeProvider>
          <PaymentFormContainer 
            linkId={linkId}
            linkData={linkData}
            isStripeConnected={isStripeConnected}
            defaultValues={defaultValues}
          />
        </StripeProvider>
      </PaymentErrorBoundary>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
