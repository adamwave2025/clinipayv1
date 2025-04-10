
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe with the publishable key from environment variables
// Use null as fallback so we can handle the error gracefully if not provided
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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
    appearance: { theme: 'stripe' }
  } : undefined;

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
