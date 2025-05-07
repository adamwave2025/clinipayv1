
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { Payment } from '@/types/payment';
import { usePaymentDetailsFetcher } from './usePaymentDetailsFetcher';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export const useInstallmentHandler = () => {
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  const { 
    paymentData, 
    setPaymentData, 
    fetchPaymentDetails 
  } = usePaymentDetailsFetcher();
  
  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    setSelectedInstallment(installment);
    
    const payment = await fetchPaymentDetails(installment);
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
