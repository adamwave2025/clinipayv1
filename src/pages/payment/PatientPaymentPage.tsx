
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import StripeProvider from '@/components/payment/StripeProvider';
import PaymentFormContainer from '@/components/payment/PaymentFormContainer';
import PaymentErrorBoundary from '@/components/payment/PaymentErrorBoundary';
import { usePaymentNavigation } from '@/hooks/usePaymentNavigation';
import { usePaymentInit } from '@/hooks/usePaymentInit';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
