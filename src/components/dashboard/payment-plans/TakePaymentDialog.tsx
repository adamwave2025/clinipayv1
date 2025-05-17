
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

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentId = "",
  patientName = "",
  patientEmail = "",
  patientPhone = "",
  amount = 50000, // £500 in pence
  onPaymentProcessed = async () => {}
}) => {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const cardCompleteRef = useRef(false);
  
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
    if (open) {
      console.log("TakePaymentDialog opened with:", { 
        paymentId, 
        patientName, 
        amount
      });
      
      if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
        console.error("Invalid payment ID provided to TakePaymentDialog:", paymentId);
        setValidationError("Invalid payment ID. Cannot process payment.");
      } else {
        setValidationError(null);
      }
    }
  }, [open, paymentId, patientName, amount]);

  // Reset dialog state when it closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setPaymentComplete(false);
        setValidationError(null);
        setIsCardComplete(false);
        cardCompleteRef.current = false;
        form.reset(); // Reset form when dialog closes
      }, 300);
    }
    onOpenChange(newOpen);
  };
  
  // Use the installment payment hook
  const { 
    handlePaymentSubmit,
    isProcessing,
    isLoading,
    isStripeReady
  } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);
  
  // Track card completion with a ref to prevent reset issues
  const handleCardChange = (event: any) => {
    console.log('Card element change:', { 
      isEmpty: event.empty, 
      isComplete: event.complete,
      hasError: event.error ? true : false,
      errorMessage: event.error?.message || 'No error' 
    });
    
    // Update both state and ref to track card completion
    setIsCardComplete(event.complete);
    cardCompleteRef.current = event.complete;
    
    // Additional debugging for validation
    if (event.error) {
      console.warn('Card validation error:', event.error.message);
    }
  };
  
  const handleSubmitPayment = async () => {
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
      cardComplete: cardCompleteRef.current
    });
    
    try {
      // Use the form data but rely on cardCompleteRef for card completion status
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
        onClick={() => onOpenChange(false)}
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
        
        {/* Card element without form field to prevent reset issues */}
        <div className="mt-4">
          <StripeCardElement 
            isLoading={isLoading || isProcessing}
            onChange={handleCardChange}
            label="Card Details"
            className="mb-4"
          />
          
          {/* Add a debug message if needed during testing */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-amber-600">
              Card Complete: {isCardComplete ? 'Yes' : 'No'}
            </div>
          )}
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
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        {paymentComplete ? (
          renderSuccessContent()
        ) : (
          <StripeProvider>
            {validationError ? renderValidationError() : renderPaymentForm()}
          </StripeProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
