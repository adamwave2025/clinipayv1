
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';

// Only validate card fields since patient info is read-only
const paymentFormSchema = z.object({
  cardNumber: z.string().min(16, "Valid card number is required"),
  expiry: z.string().min(5, "Valid expiry date is required"),
  cvc: z.string().min(3, "Valid CVC is required"),
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
}

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentId = "payment-123", // Default dummy value
  patientName = "John Smith",
  patientEmail = "john@example.com",
  patientPhone = "",
  amount = 50000 // £500 in pence
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Format amount for display (from pence to pounds)
  const displayAmount = new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP' 
  }).format(amount / 100);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: '',
      expiry: '',
      cvc: ''
    },
  });

  // Mock submit function - just for UI demonstration
  const handleSubmit = (data: PaymentFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      console.log("Form submitted with data:", data);
      toast.success("Payment processed successfully!");
      setPaymentComplete(true);
      setIsSubmitting(false);
    }, 1500);
  };
  
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Patient & Payment Information - Now read-only */}
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
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="4242 4242 4242 4242" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cvc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Process Payment"}
              </Button>
              
              <div className="text-xs text-center text-gray-500">
                <p>This is a secure payment processed by CliniPay</p>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
