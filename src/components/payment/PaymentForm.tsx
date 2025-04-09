
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { paymentFormSchema, PaymentFormValues } from './form/FormSchema';
import PersonalInfoSection from './form/PersonalInfoSection';
import PaymentDetailsSection from './form/PaymentDetailsSection';
import SubmitButton from './form/SubmitButton';

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

  const handleSubmitForm = (data: PaymentFormValues) => {
    onSubmit(data);
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
      </form>
    </Form>
  );
};

export default PaymentForm;
