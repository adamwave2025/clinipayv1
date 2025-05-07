
import { useState } from 'react';
import { usePaymentDetailsFetcher } from '../usePaymentDetailsFetcher';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';

export const useInstallmentHandler = () => {
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { paymentData, fetchPaymentDetails, setPaymentData } = usePaymentDetailsFetcher();

  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    try {
      console.log('Viewing payment details for installment:', installment);
      
      // Don't try to fetch payment details for unpaid installments
      if (installment.status !== 'paid') {
        toast.error('No payment information available for unpaid installments');
        return;
      }

      // Store the selected installment
      setSelectedInstallment(installment);
      
      // Fetch payment details for this installment
      const details = await fetchPaymentDetails(installment);
      console.log('Fetched payment details:', details);
      
      if (details) {
        // Open the payment details dialog
        setShowPaymentDetails(true);
      } else {
        toast.error('Could not find payment information');
      }
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
