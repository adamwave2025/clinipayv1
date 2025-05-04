
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { paymentFormSchema, PaymentFormValues } from './form/FormSchema';
import PersonalInfoSection from './form/PersonalInfoSection';
import PaymentDetailsSection from './form/PaymentDetailsSection';
import SubmitButton from './form/SubmitButton';
import PaymentSecurityInfo from './PaymentSecurityInfo';

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
          isLoading={isLoading}
          onApplePaySuccess={onApplePaySuccess}
        />
        
        <div className="mt-6">
          <SubmitButton isLoading={isLoading} />
          <PaymentSecurityInfo />
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;
