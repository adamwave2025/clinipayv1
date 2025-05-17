
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
      
      // Store the selected installment
      setSelectedInstallment(installment);
      
      // For unpaid installments, create a partial payment object with available data
      if (installment.status !== 'paid') {
        console.log('Creating partial payment object for unpaid installment');
        
        // Format a basic payment object for display
        const unpaidPaymentInfo: Payment = {
          id: installment.id,
          status: installment.status,
          amount: installment.amount,
          date: installment.dueDate,
          patientName: '',  // This will be filled from the plan data
          patientEmail: '',
          clinicId: '',
          netAmount: installment.amount,
          paymentMethod: '',
          reference: '',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`,
          type: 'payment_plan',
        };
        
        setPaymentData(unpaidPaymentInfo);
        setShowPaymentDetails(true);
        return;
      }

      // For paid installments, fetch payment details
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
