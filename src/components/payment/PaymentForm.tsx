
import React, { useState } from 'react';
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
  defaultValues?: Partial<PaymentFormValues>;
  onApplePaySuccess?: (paymentMethod: any) => void;
}

const PaymentForm = ({ 
  onSubmit, 
  isLoading, 
  defaultValues,
  onApplePaySuccess
}: PaymentFormProps) => {
  const [isCardComplete, setIsCardComplete] = useState(false);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      stripeCard: undefined,
    }
  });

  const handleSubmitForm = async (data: PaymentFormValues) => {
    console.log('Form submission triggered', { 
      formData: data,
      isCardComplete,
      formState: form.formState
    });
    
    if (!isCardComplete) {
      console.error('Card details are incomplete');
      form.setError('stripeCard', { 
        type: 'manual', 
        message: 'Please complete your card details' 
      });
      return;
    }
    
    try {
      console.log('Calling onSubmit handler with form data');
      onSubmit(data);
    } catch (error) {
      console.error('Error in form submission:', error);
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
          console.log('Form onSubmit event triggered');
          form.handleSubmit(handleSubmitForm)(e);
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
