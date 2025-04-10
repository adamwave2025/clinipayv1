
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PaymentFormValues } from './FormSchema';
import StripeCardSection from './StripeCardSection';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  setValue: UseFormSetValue<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, setValue, isLoading }: PaymentDetailsSectionProps) => {
  return (
    <StripeCardSection
      control={control}
      isLoading={isLoading}
      setValue={setValue}
    />
  );
};

export default PaymentDetailsSection;
