
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import StripeProvider from '@/components/payment/StripeProvider';
import StripeCardElement from '@/components/payment/form/StripeCardElement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm, FormProvider } from 'react-hook-form';
import { useStripe, useElements } from '@stripe/react-stripe-js';

interface TakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  amount?: number;
  onPaymentProcessed?: () => Promise<void>;
}

// Simple form values type
interface PaymentFormValues {
  stripeCard?: { complete?: boolean };
}

const TakePaymentContent: React.FC<Omit<TakePaymentDialogProps, 'open' | 'onOpenChange'> & {
  onClose: () => void;
  paymentComplete: boolean;
  setPaymentComplete: (complete: boolean) => void;
}> = ({
  paymentId = "",
  patientName = "",
  patientEmail = "",
  patientPhone = "",
  amount = 50000, // £500 in pence
  onPaymentProcessed = async () => {},
  onClose,
  paymentComplete,
  setPaymentComplete
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const cardCompleteRef = useRef(false);
  
  // Get direct access to Stripe elements
  const stripe = useStripe();
  const elements = useElements();
  
  // Initialize form with FormProvider to ensure context is available
  const form = useForm<PaymentFormValues>({
    defaultValues: {
      stripeCard: undefined
    }
  });
  
  // Format amount for display (from pence to pounds)
  const displayAmount = new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP' 
  }).format(amount / 100);
  
  // Validate the payment ID early
  useEffect(() => {
    console.log("TakePaymentDialog content rendered with:", { 
      paymentId, 
      patientName, 
      amount,
      stripeInitialized: !!stripe,
      elementsInitialized: !!elements
    });
    
    if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
      console.error("Invalid payment ID provided to TakePaymentDialog:", paymentId);
      setValidationError("Invalid payment ID. Cannot process payment.");
    } else {
      setValidationError(null);
    }
  }, [paymentId, patientName, amount, stripe, elements]);
  
  // Use the installment payment hook
  const { 
    handlePaymentSubmit,
    isProcessing,
    isLoading,
    isStripeReady
  } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);
  
  // Enhanced card change handler with additional logging
  const handleCardChange = (event: any) => {
    // Log the complete event object for debugging
    console.log('Card element change event:', event);
    
    // Track both in state and ref to ensure consistency
    setIsCardComplete(event.complete);
    cardCompleteRef.current = event.complete;
    
    // Enhanced logging to track card completion status
    console.log('Card completion status updated:', { 
      isEmpty: event.empty, 
      isComplete: event.complete,
      hasError: event.error ? true : false,
      errorMessage: event.error?.message || 'No error',
      cardCompleteRef: cardCompleteRef.current
    });
  };
  
  // Enhanced submit handler with better validation and logging
  const handleSubmitPayment = async () => {
    // Check if Stripe is ready before proceeding
    if (!stripe || !elements) {
      console.error("Stripe not initialized when trying to process payment");
      toast.error("Payment system is not ready. Please try again.");
      return;
    }
    
    // Get the card element and verify it exists
    const cardElement = elements.getElement('card');
    if (!cardElement) {
      console.error("Card element not found");
      toast.error("Card element not found. Please reload and try again.");
      return;
    }
    
    if (isProcessing || isLoading || !isStripeReady) {
      console.log("Payment already in progress or not ready");
      return;
    }
    
    if (!cardCompleteRef.current) {
      console.log("Card not complete, cannot process payment");
      toast.error("Please enter complete card details");
      return;
    }
    
    console.log("Processing payment with:", {
      paymentId,
      name: patientName,
      email: patientEmail,
      cardComplete: cardCompleteRef.current,
      stripeReady: !!stripe,
      elementsReady: !!elements,
      cardElementAvailable: !!cardElement
    });
    
    try {
      // Pass the explicit isCardComplete flag to ensure proper validation
      const result = await handlePaymentSubmit({
        name: patientName,
        email: patientEmail,
        phone: patientPhone,
        stripeCard: { complete: true }
      }, cardCompleteRef.current);
      
      if (result.success) {
        setPaymentComplete(true);
      } else {
        toast.error(result.error || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment submission error:", error);
      toast.error(error.message || "Payment processing failed");
    }
  };

  // Content when there's a validation error
  const renderValidationError = () => (
    <div className="py-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{validationError}</AlertDescription>
      </Alert>
      <Button 
        className="w-full mt-6"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );

  // Payment form content
  const renderPaymentForm = () => (
    <FormProvider {...form}>
      <div className="space-y-4">
        {/* Patient & Payment Information - Read-only */}
        <div className="rounded-md bg-gray-50 p-4 mb-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">Amount:</span>
            <span className="font-bold">{displayAmount}</span>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Patient:</span>
              <span>{patientName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span>{patientEmail}</span>
            </div>
            
            {patientPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span>{patientPhone}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Card element with improved handling */}
        <div className="mt-4">
          <StripeCardElement 
            isLoading={isLoading || isProcessing}
            onChange={handleCardChange}
            label="Card Details"
            className="mb-4"
          />
        </div>
        
        <Button 
          className="w-full mt-2" 
          disabled={isLoading || isProcessing || !isStripeReady || !isCardComplete}
          onClick={handleSubmitPayment}
          type="button"
        >
          {isLoading || isProcessing ? "Processing..." : "Process Payment"}
        </Button>
        
        <div className="text-xs text-center text-gray-500">
          <p>This is a secure payment processed by CliniPay</p>
        </div>
      </div>
    </FormProvider>
  );

  // Success content
  const renderSuccessContent = () => (
    <div className="py-6 px-2">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium">Payment Successful</h3>
        <p className="text-sm text-gray-500">
          The payment of {displayAmount} has been processed successfully.
        </p>
        <Button 
          className="mt-4 w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {paymentComplete ? (
        renderSuccessContent()
      ) : (
        validationError ? renderValidationError() : renderPaymentForm()
      )}
    </>
  );
};

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  ...props
}) => {
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Reset dialog state when it closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setPaymentComplete(false);
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        <StripeProvider>
          <TakePaymentContent 
            {...props}
            onClose={() => onOpenChange(false)}
            paymentComplete={paymentComplete}
            setPaymentComplete={setPaymentComplete}
          />
        </StripeProvider>
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
