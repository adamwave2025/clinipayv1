
import React from 'react';
import { Control } from 'react-hook-form';
import { PaymentFormValues } from './FormSchema';
import SimplePaymentDetailsSection from './SimplePaymentDetailsSection';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, isLoading }: PaymentDetailsSectionProps) => {
  return (
    <SimplePaymentDetailsSection 
      control={control}
      isLoading={isLoading}
    />
  );
};

export default PaymentDetailsSection;
