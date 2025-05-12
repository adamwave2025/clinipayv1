
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import { ElementsProvider } from '@/components/payment/StripeProvider';
import StripeCardElement from '@/components/payment/form/StripeCardElement';

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
  
  // Format amount for display (from pence to pounds)
  const displayAmount = new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP' 
  }).format(amount / 100);
  
  // Use our custom hook for processing installment payments
  const { 
    handlePaymentSubmit,
    isProcessing,
    isLoading,
    isStripeReady
  } = useInstallmentPayment(paymentId, amount, onPaymentProcessed);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: patientName || '',
      email: patientEmail || '',
      phone: patientPhone || '',
      stripeCard: undefined,
    },
  });

  // Submit handler that calls our payment processor
  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const result = await handlePaymentSubmit(data);
      
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
  
  // Reset dialog state when it closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setPaymentComplete(false);
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
          <ElementsProvider>
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
                
                {/* Card Details Section */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Card Details</h3>
                  
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
                    render={({ field }) => (
                      <StripeCardElement 
                        isLoading={isLoading || isProcessing}
                        onChange={(e) => {
                          field.onChange(e.complete ? { complete: true } : { empty: true });
                        }}
                      />
                    )}
                  />
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
          </ElementsProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
