
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { paymentFormSchema, PaymentFormValues } from './form/FormSchema';
import PersonalInfoSection from './form/PersonalInfoSection';
import SimplePaymentDetailsSection from './form/SimplePaymentDetailsSection';
import SubmitButton from './form/SubmitButton';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

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
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      cardComplete: false,
    }
  });

  const handleSubmitForm = async (data: PaymentFormValues) => {
    if (!data.cardNumber || !data.cardExpiry || !data.cardCvc) {
      toast.error("Please complete all card information fields.");
      return;
    }

    // Pass the form data to the parent component for payment processing
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
        <PersonalInfoSection 
          control={form.control} 
          isLoading={isLoading} 
        />
        
        <SimplePaymentDetailsSection 
          control={form.control}
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
