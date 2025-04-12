
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import PaymentFormSection from '@/components/payment/PaymentFormSection';
import { PaymentLinkData } from '@/types/paymentLink';

interface PaymentFormContainerProps {
  linkId?: string;
  linkData: PaymentLinkData;
  isStripeConnected: boolean;
  defaultValues?: Partial<PaymentFormValues>;
}

const PaymentFormContainer = ({ 
  linkId, 
  linkData, 
  isStripeConnected, 
  defaultValues 
}: PaymentFormContainerProps) => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  const {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit
  } = usePaymentProcess(linkId, linkData);
  
  React.useEffect(() => {
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

export default PaymentFormContainer;
