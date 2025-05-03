
import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import PaymentPageLoading from '@/components/payment/PaymentPageLoading';
import StripeProvider from '@/components/payment/StripeProvider';
import PaymentFormContainer from '@/components/payment/PaymentFormContainer';
import PaymentErrorBoundary from '@/components/payment/PaymentErrorBoundary';
import { usePaymentNavigation } from '@/hooks/usePaymentNavigation';
import { usePaymentInit } from '@/hooks/usePaymentInit';

const PatientPaymentPage = () => {
  const { linkId, errorParam, navigateToFailedPage } = usePaymentNavigation();
  const { linkData, isLoading, initError } = usePaymentInit(linkId, errorParam);

  if (isLoading) {
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
