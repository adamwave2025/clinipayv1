
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import StripeProvider from '@/components/payment/StripeProvider';
import StripeCardElement from '@/components/payment/form/StripeCardElement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
      }, 300);
    }
    onOpenChange(newOpen);
  };
  
  // Use a stable component to reduce re-renders
  const PaymentProcessor = React.memo(() => {
    const { 
      handlePaymentSubmit,
      isProcessing,
      isLoading,
      isStripeReady
    } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);
    
    // Track card completion state with a ref to preserve during re-renders
    const cardCompleteRef = React.useRef(false);
    
    const handleCardChange = useCallback((event: any) => {
      console.log('Card element change:', { 
        isEmpty: event.empty, 
        isComplete: event.complete,
        hasError: event.error ? true : false,
        errorMessage: event.error?.message || 'No error' 
      });
      
      // Update both state and ref to track card completion
      setIsCardComplete(event.complete);
      cardCompleteRef.current = event.complete;
    }, []);
    
    const handleSubmitPayment = useCallback(async () => {
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
    }, [handlePaymentSubmit, isProcessing, isLoading, isStripeReady, paymentId, patientName, patientEmail, patientPhone]);
    
    if (validationError) {
      return (
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
    }

    return (
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
        
        {/* Simplified card element implementation */}
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
        >
          {isLoading || isProcessing ? "Processing..." : "Process Payment"}
        </Button>
        
        <div className="text-xs text-center text-gray-500">
          <p>This is a secure payment processed by CliniPay</p>
        </div>
      </div>
    );
  });
  
  // Prevent unnecessary re-renders by setting displayName
  PaymentProcessor.displayName = 'PaymentProcessor';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        {paymentComplete ? (
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
        ) : (
          <StripeProvider>
            <PaymentProcessor />
          </StripeProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
