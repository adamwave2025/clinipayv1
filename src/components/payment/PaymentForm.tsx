
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { paymentFormSchema, PaymentFormValues } from './form/FormSchema';
import PersonalInfoSection from './form/PersonalInfoSection';
import PaymentDetailsSection from './form/PaymentDetailsSection';
import SubmitButton from './form/SubmitButton';
import { Lock } from 'lucide-react';

interface PaymentFormProps {
  onSubmit: (data: PaymentFormValues) => void;
  isLoading: boolean;
  amount: number; // Amount in pence
  defaultValues?: Partial<PaymentFormValues>;
  onApplePaySuccess?: (paymentMethod: any) => void;
}

const PaymentForm = ({ 
  onSubmit, 
  isLoading,
  amount = 100, // Default to £1 (100p) to prevent zero-amount payments
  defaultValues,
  onApplePaySuccess
}: PaymentFormProps) => {
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  console.log('PaymentForm: Rendering with amount:', amount);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      stripeCard: undefined,
    }
  });

  // Reset submission flag when loading state changes
  useEffect(() => {
    if (!isLoading && formSubmitted) {
      setFormSubmitted(false);
    }
  }, [isLoading, formSubmitted]);

  const handleSubmitForm = async (data: PaymentFormValues) => {
    // Prevent multiple submissions
    if (formSubmitted || isLoading) {
      console.log('Preventing duplicate submission', { formSubmitted, isLoading });
      return;
    }
    
    console.log('Form submission triggered', { 
      formData: data,
      isCardComplete,
      formState: form.formState,
      paymentAmount: amount
    });
    
    if (!isCardComplete) {
      console.error('Card details are incomplete');
      form.setError('stripeCard', { 
        type: 'manual', 
        message: 'Please complete your card details' 
      });
      return;
    }
    
    if (amount <= 0) {
      console.error('Invalid payment amount:', amount);
      form.setError('stripeCard', {
        type: 'manual',
        message: 'Invalid payment amount. Please contact support.'
      });
      return;
    }
    
    try {
      setFormSubmitted(true);
      console.log('Calling onSubmit handler with form data and amount:', amount);
      onSubmit(data);
    } catch (error) {
      console.error('Error in form submission:', error);
      setFormSubmitted(false);
    }
  };
  
  const handleCardElementChange = (event: any) => {
    setIsCardComplete(event.complete);
    
    if (event.error) {
      form.setError('stripeCard', { 
        type: 'manual', 
        message: event.error.message || 'Invalid card details' 
      });
    } else {
      form.clearErrors('stripeCard');
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault(); // Prevent default form submission
          console.log('Form onSubmit event triggered');
          if (!formSubmitted && !isLoading) {
            form.handleSubmit(handleSubmitForm)(e);
          } else {
            console.log('Form submission prevented - already submitted or loading');
          }
        }} 
        className="space-y-6"
      >
        <PersonalInfoSection 
          control={form.control} 
          isLoading={isLoading} 
        />
        
        <PaymentDetailsSection
          control={form.control}
          isLoading={isLoading}
          amount={amount}
          onApplePaySuccess={onApplePaySuccess}
          onCardElementChange={handleCardElementChange}
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
