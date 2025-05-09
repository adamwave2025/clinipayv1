
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/formatters';

interface PaymentFormSectionProps {
  isStripeConnected: boolean;
  processingPayment: boolean;
  isSubmitting: boolean;
  amount: number; // Amount in pence
  defaultValues?: Partial<PaymentFormValues>;
  onSubmit: (data: PaymentFormValues) => void;
  onApplePaySuccess?: (paymentMethod: any) => void;
}

const PaymentFormSection: React.FC<PaymentFormSectionProps> = ({
  isStripeConnected,
  processingPayment,
  isSubmitting,
  amount = 100, // Default to £1 (100p)
  defaultValues,
  onSubmit,
  onApplePaySuccess
}) => {
  console.log('PaymentFormSection: Rendered with amount:', amount);
  
  // Format the amount for display
  const formattedAmount = formatCurrency(amount);

  return (
    <Card className="card-shadow h-full">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-center mb-2 text-gray-800">
          Complete Your Payment
        </h2>
        
        {amount > 0 && (
          <p className="text-center mb-6 text-lg font-medium text-emerald-600">
            {formattedAmount}
          </p>
        )}
        
        {!isStripeConnected ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Unavailable</AlertTitle>
            <AlertDescription>
              This clinic has not set up payment processing. Please contact the clinic directly to arrange payment.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {processingPayment && (
              <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-md">
                <LoadingSpinner size="md" />
                <p className="mt-3 text-gray-600 font-medium">Processing payment...</p>
              </div>
            )}
            <div className={`relative ${processingPayment ? 'pointer-events-none' : ''}`}>
              <PaymentForm 
                onSubmit={onSubmit}
                isLoading={isSubmitting}
                amount={amount}
                defaultValues={defaultValues}
                onApplePaySuccess={onApplePaySuccess}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentFormSection;
