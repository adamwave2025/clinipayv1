
import React, { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useIsMobile } from '@/hooks/use-mobile';

interface ApplePayButtonProps {
  amount: number;
  isLoading: boolean;
  onApplePaySuccess: (paymentMethod: any) => void;
}

const ApplePayButton = ({ amount, isLoading, onApplePaySuccess }: ApplePayButtonProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const isMobile = useIsMobile();
  
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !elements || isLoading) return;

    // Create the payment request object
    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: 'Total',
        amount: Math.round(amount), // Ensure amount is properly rounded (already in cents)
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if the user can make a payment with Apple Pay
    pr.canMakePayment().then(result => {
      if (result && result.applePay) {
        console.log('Apple Pay is available'); // Add logging to help debug
        setCanMakePayment(true);
        setPaymentRequest(pr);
      } else {
        console.log('Apple Pay is not available', result); // Add logging to help debug
        setCanMakePayment(false);
      }
    });

    // Listen for the payment method event
    pr.on('paymentmethod', (e) => {
      console.log('Payment method received', e.paymentMethod); // Add logging to help debug
      onApplePaySuccess(e.paymentMethod);
    });

    return () => {
      // Cleanup
      pr.off('paymentmethod');
    };
  }, [stripe, elements, amount, isLoading, onApplePaySuccess]);

  // Only render on iOS devices when Apple Pay is available
  if (!canMakePayment || !paymentRequest || !isMobile) {
    return null;
  }

  const paymentRequestOptions = {
    paymentRequest,
    style: {
      paymentRequestButton: {
        type: 'buy' as const,
        theme: 'dark' as const,
        height: '48px',
      },
    },
  };

  return (
    <div className="mb-4 mt-2">
      <div className="relative">
        <PaymentRequestButtonElement
          options={paymentRequestOptions}
          className={isLoading ? "opacity-50 pointer-events-none" : ""}
        />
      </div>
      <div className="text-xs text-center text-gray-500 mt-2">
        Pay securely with Apple Pay
      </div>
    </div>
  );
};

export default ApplePayButton;
