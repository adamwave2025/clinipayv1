
import { useState } from 'react';
import { usePaymentDetailsFetcher } from './usePaymentDetailsFetcher';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';

export const useInstallmentHandler = () => {
  // Renamed to avoid conflict with primary selectedInstallment
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { paymentData, fetchPaymentDetails, setPaymentData } = usePaymentDetailsFetcher();

  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    try {
      console.log('Viewing payment details for installment:', installment);
      
      // Store the selected installment regardless of payment status
      setSelectedInstallment(installment);
      
      // For paid payments, try to fetch payment details
      if (installment.status === 'paid') {
        const details = await fetchPaymentDetails(installment);
        console.log('Fetched payment details:', details);
        // Even if we couldn't get payment details, still show the dialog with installment info
      } else {
        // For non-paid payments, just clear payment data
        setPaymentData(null);
        console.log('Showing installment details for non-paid payment');
      }
      
      // Always open the payment details dialog
      setShowPaymentDetails(true);
      
    } catch (error) {
      console.error('Error handling payment details:', error);
      toast.error('Failed to load payment details');
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
