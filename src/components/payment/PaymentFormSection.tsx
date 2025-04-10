
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe('pk_test_51OgHYeEXQXA8Yw4lPwEiRXfBg5MCGN8Ri3aELhMOgYm1YyY6SeBwsJcEvL6GZ7fhitWDIyHjRsZ4s3lw2tJgPnzq00dBEHEp2C');

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
        ) : clientSecret && processingPayment ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
            <p className="ml-3 text-gray-600">Processing payment...</p>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
            <PaymentForm 
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              defaultValues={defaultValues}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentFormSection;
