
// Note: This is a duplicate of the standalone ApplePayButton component for use within the form
// This ensures compatibility with the existing form schema and component structure

import React, { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useIsMobile } from '@/hooks/use-mobile';
import { poundsToPence, validatePoundsAmount } from '../../services/CurrencyService';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      // Add very detailed debugging to catch the issue
      console.log('--- Apple Pay Debug Info ---');
      console.log('Raw amount provided to ApplePayButton:', amount);
      console.log('Amount type:', typeof amount);
      
      // Enhanced validation - be extremely strict about what's accepted
      if (amount === undefined || amount === null) {
        console.error('Apple Pay amount is null or undefined');
        setError('Payment amount is missing. Please try again or use a different payment method.');
        return;
      }
      
      if (isNaN(Number(amount))) {
        console.error('Apple Pay amount is not a number:', amount);
        setError('Invalid payment format. Please try again or use a different payment method.');
        return;
      }
      
      // Parse as number to ensure we're working with a number
      const numericAmount = Number(amount);
      
      if (numericAmount <= 0) {
        console.error('Apple Pay amount is zero or negative:', numericAmount);
        setError('Payment amount must be greater than zero. Please try again or use a different payment method.');
        return;
      }
      
      // Validate the amount is in the expected format (should be pounds)
      if (!validatePoundsAmount(numericAmount, 'ApplePayButton')) {
        console.error('Apple Pay amount validation failed:', numericAmount);
        setError('Invalid payment amount. Please try again or use a different payment method.');
        return;
      }
      
      console.log('Amount validation passed. Using amount (pounds):', numericAmount);
      
      // Convert the amount from pounds to pence for Stripe's API
      const amountInPence = poundsToPence(numericAmount);
      console.log('Amount converted to pence for Stripe:', amountInPence);
      
      // Validate again after conversion
      if (amountInPence <= 0) {
        console.error('Converted pence amount is invalid:', amountInPence);
        setError('Payment processing error. Please try again or use a different payment method.');
        return;
      }
      
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
      <Alert variant="destructive" className="mb-4 mt-2">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
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
