
import React, { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useIsMobile } from '@/hooks/use-mobile';
import { poundsToPence } from '@/services/CurrencyService';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !elements || isLoading) return;

    try {
      console.log('Setting up Apple Pay with amount:', amount);
      
      // Validate amount to prevent errors
      if (!amount || amount <= 0) {
        console.error('Invalid amount for Apple Pay:', amount);
        setError('Invalid payment amount');
        return;
      }
      
      // Convert the amount from pounds to pence for Stripe's API
      const amountInPence = Math.round(amount * 100); 
      console.log('Amount in pence for Stripe:', amountInPence);
      
      // Create the payment request object
      const pr = stripe.paymentRequest({
        country: 'GB',
        currency: 'gbp',
        total: {
          label: 'Total',
          amount: amountInPence, // Amount in pence
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: true,
      });

      // Check if the user can make a payment with Apple Pay
      pr.canMakePayment().then(result => {
        if (result && result.applePay) {
          console.log('Apple Pay is available');
          setCanMakePayment(true);
          setPaymentRequest(pr);
        } else {
          console.log('Apple Pay is not available', result);
          setCanMakePayment(false);
        }
      });

      // Listen for the payment method event
      pr.on('paymentmethod', (e) => {
        console.log('Payment method received', e.paymentMethod);
        onApplePaySuccess(e.paymentMethod);
      });

      return () => {
        // Cleanup
        pr.off('paymentmethod');
      };
    } catch (err: any) {
      console.error('Error setting up Apple Pay:', err);
      setError(err.message || 'Failed to initialize Apple Pay');
    }
  }, [stripe, elements, amount, isLoading, onApplePaySuccess]);

  // Only render on iOS devices when Apple Pay is available
  if (!canMakePayment || !paymentRequest || !isMobile) {
    return null;
  }

  if (error) {
    return (
      <div className="mb-4 mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
        {error}
      </div>
    );
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
