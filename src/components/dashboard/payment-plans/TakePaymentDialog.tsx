
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import PaymentForm from '@/components/payment/PaymentForm';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import { formatCurrency } from '@/utils/formatters';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe once outside of the component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface TakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  onPaymentProcessed: () => Promise<void>;
}

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentId,
  patientName,
  patientEmail,
  patientPhone,
  amount,
  onPaymentProcessed
}) => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    isProcessing,
    isLoading,
    isStripeReady,
    handlePaymentSubmit,
  } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);

  // Prepare default values for the payment form
  const defaultValues: Partial<PaymentFormValues> = {
    name: patientName || '',
    email: patientEmail || '',
    phone: patientPhone || '',
  };

  const handlePaymentFormSubmit = async (formData: PaymentFormValues) => {
    try {
      const result = await handlePaymentSubmit(formData);
      
      if (result.success) {
        setPaymentSuccess(true);
        setPaymentError(null);
      } else {
        setPaymentError(result.error || 'Payment processing failed');
        setPaymentSuccess(false);
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      setPaymentError(error.message || 'An unexpected error occurred');
      setPaymentSuccess(false);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Small delay to prevent flickering during close animation
      setTimeout(() => {
        setPaymentSuccess(false);
        setPaymentError(null);
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        {!isStripeReady ? (
          <div className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner size="md" />
            <p className="mt-4 text-gray-600">Loading payment system...</p>
          </div>
        ) : paymentSuccess ? (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-medium text-green-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Payment Successful
              </h3>
              <p className="mt-2 text-green-700">
                Payment of {formatCurrency(amount)} has been successfully processed for {patientName}.
              </p>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => handleOpenChange(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            </div>
          </div>
        ) : paymentError ? (
          <div className="p-6 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPaymentError(null);
                }}
              >
                Try Again
              </Button>
              <Button 
                onClick={() => handleOpenChange(false)}
                variant="default"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Processing payment for:</p>
              <p className="font-medium">{patientName}</p>
              <p className="text-sm text-gray-600 mb-1 mt-2">Amount:</p>
              <p className="text-lg font-bold">{formatCurrency(amount)}</p>
            </div>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                onSubmit={handlePaymentFormSubmit}
                isLoading={isProcessing || isLoading}
                amount={amount}
                defaultValues={defaultValues}
              />
            </Elements>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
