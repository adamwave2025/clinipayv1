
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import { usePaymentProcess } from '@/hooks/usePaymentProcess';
import PaymentFormSection from '@/components/payment/PaymentFormSection';
import { PaymentLinkData } from '@/types/paymentLink';
import { toast } from 'sonner';
import { validatePenceAmount } from '@/services/CurrencyService';

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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [safeAmount, setSafeAmount] = useState<number>(100); // Default to £1 (100p)

  const {
    isSubmitting,
    processingPayment,
    handlePaymentSubmit,
    handleApplePaySubmit
  } = usePaymentProcess(linkId, linkData);
  
  useEffect(() => {
    // Validate the payment link data before proceeding
    if (!linkData || !linkData.clinic) {
      console.error("Payment form container: Invalid payment link data:", linkData);
      setErrorDetails("Invalid payment link data");
      setHasError(true);
      return;
    }
    
    if (!isStripeConnected) {
      console.warn("Payment form container: Stripe not connected for clinic");
    }
    
    // Validate and ensure we have a valid amount
    let amount = linkData.amount || 0;
    
    console.log("Payment form container: Raw amount from linkData:", amount);
    
    if (!validatePenceAmount(amount, 'PaymentFormContainer')) {
      console.warn("Payment form container: Invalid amount detected, using minimum safe amount");
      amount = 100; // Default to £1 (100p)
    }
    
    setSafeAmount(amount);
    console.log("Payment form container: Using amount:", amount);
    
  }, [linkData, isStripeConnected]);

  useEffect(() => {
    if (hasError) {
      // Only navigate if we have a serious error
      if (errorDetails) {
        console.error(`Payment form error: ${errorDetails}`);
        toast.error(`Payment error: ${errorDetails}`);
      }
      
      // Add a small delay before navigation to allow error logging and toast to show
      const timer = setTimeout(() => {
        navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hasError, navigate, linkId, errorDetails]);

  const handlePaymentWithErrorCatch = async (formData: PaymentFormValues) => {
    try {
      console.log("Starting payment submission with form data:", { 
        name: formData.name, 
        email: formData.email,
        hasPhone: !!formData.phone,
        amount: safeAmount
      });
      
      if (safeAmount <= 0) {
        throw new Error("Invalid payment amount: " + safeAmount);
      }
      
      await handlePaymentSubmit(formData);
    } catch (error) {
      console.error("Payment form error:", error);
      toast.error("Payment processing failed. Please try again later.");
      setErrorDetails(error instanceof Error ? error.message : String(error));
      setHasError(true);
    }
  };

  const handleApplePaySuccess = async (paymentMethod: any) => {
    try {
      console.log("Apple Pay payment method received:", paymentMethod);
      
      if (safeAmount <= 0) {
        throw new Error("Invalid payment amount for Apple Pay: " + safeAmount);
      }
      
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
      setErrorDetails(error instanceof Error ? error.message : String(error));
      setHasError(true);
    }
  };

  // If we have invalid link data, display a helpful message
  if (!linkData || !linkData.clinic) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Payment information unavailable</h3>
        <p className="mt-2 text-red-600">
          There was a problem loading the payment details. 
          Please contact the clinic directly or try again later.
        </p>
        <button
          onClick={() => navigate('/payment/failed')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Go to Error Page
        </button>
      </div>
    );
  }

  return (
    <PaymentFormSection 
      isStripeConnected={isStripeConnected}
      processingPayment={processingPayment}
      isSubmitting={isSubmitting}
      amount={safeAmount}
      defaultValues={defaultValues}
      onSubmit={handlePaymentWithErrorCatch}
      onApplePaySuccess={handleApplePaySuccess}
    />
  );
};

export default PaymentFormContainer;
