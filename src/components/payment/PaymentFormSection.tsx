
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe with the publishable key from window.ENV
// Add a safety check to prevent accessing undefined properties
const stripePromise = typeof window !== 'undefined' && window.ENV ? 
  loadStripe(window.ENV.PUBLISHABLE_KEY || '') : 
  null;

// Log to debug Stripe initialization
console.log('Stripe initialization with key available:', 
  typeof window !== 'undefined' && window.ENV ? !!window.ENV.PUBLISHABLE_KEY : false);

interface PaymentFormSectionProps {
  isStripeConnected: boolean;
  clientSecret: string | null;
  processingPayment: boolean;
  isSubmitting: boolean;
  defaultValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void;
}

const PaymentFormSection = ({
  isStripeConnected,
  clientSecret,
  processingPayment,
  isSubmitting,
  defaultValues,
  onSubmit
}: PaymentFormSectionProps) => {
  // Options for Stripe Elements - only pass clientSecret when we have it
  const options = clientSecret ? {
    // Use clientSecret as part of payment_intent_client_secret instead of directly
    // This matches the expected Stripe type
    payment_intent_client_secret: clientSecret,
    appearance: { theme: 'stripe' as const }  // Type assertion to ensure theme is one of the allowed values
  } : undefined;

  // Add a check for Stripe initialization
  const isStripeInitialized = !!stripePromise;

  return (
    <Card className="card-shadow h-full">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
          Complete Your Payment
        </h2>
        
        {!isStripeConnected ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Unavailable</AlertTitle>
            <AlertDescription>
              This clinic has not set up payment processing. Please contact the clinic directly to arrange payment.
            </AlertDescription>
          </Alert>
        ) : !isStripeInitialized ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment System Error</AlertTitle>
            <AlertDescription>
              The payment system is not properly initialized. Please refresh the page or contact support.
            </AlertDescription>
          </Alert>
        ) : processingPayment ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
            <p className="ml-3 text-gray-600">Processing payment...</p>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm 
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              defaultValues={defaultValues}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentFormSection;
