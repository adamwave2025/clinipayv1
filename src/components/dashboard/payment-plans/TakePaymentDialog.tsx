
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';

// Simple form schema for the payment form
const paymentFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
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
      name: patientName,
      email: patientEmail,
      phone: patientPhone,
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-sm font-semibold">Payment Details</h3>
                  <p className="text-xs text-gray-500">Payment ID: {paymentId}</p>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>Amount:</span>
                  <span className="font-bold">{displayAmount}</span>
                </div>
              
                <h3 className="text-sm font-semibold pt-2">Patient Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Patient name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="patient@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+44 1234 567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <h3 className="text-sm font-semibold pt-2">Card Details</h3>
                
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="4242 4242 4242 4242" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
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
              
              <div className="pt-4">
                <Button 
                  type="submit"
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Process Payment"}
                </Button>
              </div>
              
              <div className="text-xs text-center text-gray-500">
                <p>This is a secure payment processed by CliniPay</p>
                <p>Your card details are encrypted and never stored on our servers</p>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
