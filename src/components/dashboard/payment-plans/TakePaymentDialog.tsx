
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import StripeProvider from '@/components/payment/StripeProvider';
import StripeCardElement from '@/components/payment/form/StripeCardElement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form schema for patient and payment details
const paymentFormSchema = z.object({
  name: z.string().min(2, "Patient name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  stripeCard: z.object({
    complete: z.boolean().optional(),
    empty: z.boolean().optional()
  }).optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

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
  const cardElementRef = useRef<{ complete: boolean } | null>(null);
  
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
  
  // Create the form outside of payment processing logic
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: patientName || '',
      email: patientEmail || '',
      phone: patientPhone || '',
      stripeCard: undefined,
    },
  });
  
  // Use a component to wrap payment processing logic so it only loads when the dialog is open
  // This prevents unnecessary processing when the dialog is closed
  const PaymentProcessor = () => {
    // Move the hook inside this component to ensure it's only called when StripeProvider is ready
    const { 
      handlePaymentSubmit,
      isProcessing,
      isLoading,
      isStripeReady
    } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);
    
    // Track card completion state
    const handleCardChange = (event: any) => {
      console.log('Card element change:', { 
        isEmpty: event.empty, 
        isComplete: event.complete
      });
      
      setIsCardComplete(event.complete);
      // Store card state in ref to preserve during rerenders
      cardElementRef.current = {
        complete: event.complete
      };
      
      // Update the form state
      form.setValue('stripeCard', {
        complete: event.complete,
        empty: event.empty
      });
      
      // Clear form error when card becomes complete
      if (event.complete) {
        form.clearErrors('stripeCard');
      }
    };
    
    // Submit handler that calls our payment processor
    const onSubmit = async (data: PaymentFormValues) => {
      try {
        console.log("Submitting payment with payment ID:", paymentId);
        
        if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
          console.error("Payment ID is missing or invalid:", paymentId);
          toast.error("Payment ID is required");
          return;
        }
        
        // Check if card is complete using the ref and current state
        const isCardReady = cardElementRef.current?.complete || isCardComplete;
        
        if (!isCardReady) {
          console.error("Card details are incomplete");
          form.setError('stripeCard', {
            type: 'manual',
            message: 'Please complete your card details'
          });
          toast.error("Please enter complete card details");
          return;
        }
        
        const result = await handlePaymentSubmit(data, isCardReady);
        
        if (result.success) {
          setPaymentComplete(true);
          form.reset();
        } else {
          toast.error(result.error || "Payment failed");
        }
      } catch (error: any) {
        console.error("Payment submission error:", error);
        toast.error(error.message || "Payment processing failed");
      }
    };
    
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          
          {/* Card Details Section - Removed duplicate header */}
          <div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stripeCard"
              render={() => (
                <StripeCardElement 
                  isLoading={isLoading || isProcessing}
                  onChange={handleCardChange}
                />
              )}
            />
            
            {/* Display validation error for card */}
            {form.formState.errors.stripeCard && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.stripeCard.message}
              </p>
            )}
          </div>
          
          <Button 
            type="submit"
            className="w-full mt-2" 
            disabled={isLoading || isProcessing || !isStripeReady}
          >
            {isLoading || isProcessing ? "Processing..." : "Process Payment"}
          </Button>
          
          <div className="text-xs text-center text-gray-500">
            <p>This is a secure payment processed by CliniPay</p>
          </div>
        </form>
      </Form>
    );
  };
  
  // Reset dialog state when it closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setPaymentComplete(false);
        setValidationError(null);
        setIsCardComplete(false);
        cardElementRef.current = null;
        form.reset();
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
