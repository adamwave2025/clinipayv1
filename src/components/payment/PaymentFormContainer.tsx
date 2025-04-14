
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import PaymentFormSection from '@/components/payment/PaymentFormSection';
import { PaymentLinkData } from '@/types/paymentLink';
import { toast } from 'sonner';

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
    handlePaymentSubmit,
    handleApplePaySubmit
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

  const handleApplePaySuccess = async (paymentMethod: any) => {
    try {
      console.log("Apple Pay payment method received:", paymentMethod);
      toast.info("Processing Apple Pay payment...");
      
      // Use the payment method to complete the payment
      await handleApplePaySubmit({
        name: paymentMethod.billing_details.name || defaultValues?.name || '',
        email: paymentMethod.billing_details.email || defaultValues?.email || '',
        phone: paymentMethod.billing_details.phone || defaultValues?.phone || '',
        paymentMethod: paymentMethod
      });
    } catch (error) {
      console.error("Apple Pay payment error:", error);
      toast.error("Apple Pay payment failed");
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
      onApplePaySuccess={handleApplePaySuccess}
    />
  );
};

export default PaymentFormContainer;
