
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { paymentFormSchema, PaymentFormValues } from './form/FormSchema';
import PersonalInfoSection from './form/PersonalInfoSection';
import PaymentDetailsSection from './form/PaymentDetailsSection';
import SubmitButton from './form/SubmitButton';
import { Lock } from 'lucide-react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

interface PaymentFormProps {
  onSubmit: (data: PaymentFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<PaymentFormValues>;
}

const PaymentForm = ({ onSubmit, isLoading, defaultValues }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      cardComplete: false,
    }
  });

  const handleSubmitForm = async (data: PaymentFormValues) => {
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      toast.error("Payment processing is initializing. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("There was a problem with the payment form. Please refresh and try again.");
      return;
    }

    // Confirm the card payment
    const { error } = await stripe.confirmCardPayment(window.location.search.split('client_secret=')[1], {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
        },
      },
    });

    if (error) {
      toast.error(error.message || "Payment failed. Please try again.");
    } else {
      // Payment succeeded, call the onSubmit callback to create payment record in database
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
        <PersonalInfoSection 
          control={form.control} 
          isLoading={isLoading} 
        />
        
        <PaymentDetailsSection 
          control={form.control}
          setValue={form.setValue} 
          isLoading={isLoading} 
        />
        
        <SubmitButton isLoading={isLoading} />
        
        {/* Security text below the submit button */}
        <div className="text-center text-sm text-gray-500 flex items-center justify-center mt-4">
          <Lock className="h-4 w-4 mr-1 text-green-600" />
          Secure payment processed by CliniPay
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;
