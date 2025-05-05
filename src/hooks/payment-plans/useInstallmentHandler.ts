
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { Payment } from '@/types/payment';
import { usePaymentDetailsFetcher } from './usePaymentDetailsFetcher';

export const useInstallmentHandler = () => {
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  const { 
    paymentData, 
    setPaymentData, 
    fetchPaymentDataForInstallment 
  } = usePaymentDetailsFetcher();
  
  const handleViewPaymentDetails = async (installment: any) => {
    setSelectedInstallment(installment);
    
    const payment = await fetchPaymentDataForInstallment(installment);
    if (payment) {
      setPaymentData(payment);
      setShowPaymentDetails(true); // Open the payment details dialog
    }
  };
  
  return {
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails
  };
};
