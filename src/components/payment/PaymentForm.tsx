
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export interface PaymentFormValues {
  name: string;
  email: string;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number' }),
  cardNumber: z.string()
    .min(16, { message: 'Please enter a valid card number' })
    .max(19, { message: 'Please enter a valid card number' })
    .refine((val) => /^[\d\s]+$/.test(val), { message: 'Card number can only contain digits and spaces' }),
  cardExpiry: z.string()
    .min(5, { message: 'Please enter a valid expiry date (MM/YY)' })
    .max(5, { message: 'Please enter a valid expiry date (MM/YY)' })
    .refine((val) => /^\d{2}\/\d{2}$/.test(val), { message: 'Expiry date should be in MM/YY format' }),
  cardCvc: z.string()
    .min(3, { message: 'CVC must be 3-4 digits' })
    .max(4, { message: 'CVC must be 3-4 digits' })
    .refine((val) => /^\d+$/.test(val), { message: 'CVC can only contain digits' }),
});

interface PaymentFormProps {
  onSubmit: (data: PaymentFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<PaymentFormValues>;
}

const PaymentForm = ({ onSubmit, isLoading, defaultValues }: PaymentFormProps) => {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      cardNumber: defaultValues?.cardNumber || '',
      cardExpiry: defaultValues?.cardExpiry || '',
      cardCvc: defaultValues?.cardCvc || '',
    }
  });

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    form.setValue('cardNumber', formatted, { shouldValidate: true });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\//g, '');
    let formatted = value;
    
    if (value.length > 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    form.setValue('cardExpiry', formatted, { shouldValidate: true });
  };

  const handleSubmitForm = (data: PaymentFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Your Information</h2>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Smith"
                    disabled={isLoading}
                    {...field}
                  />
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    {...field}
                  />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+44 1234 567890"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Payment Details</h2>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          
          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field: { onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    disabled={isLoading}
                    onChange={handleCardNumberChange}
                    {...fieldProps}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cardExpiry"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MM/YY"
                      maxLength={5}
                      disabled={isLoading}
                      onChange={handleExpiryChange}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cardCvc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123"
                      maxLength={4}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 btn-gradient text-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : null}
          Continue to Payment
        </Button>
      </form>
    </Form>
  );
};

export default PaymentForm;
