
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
      
      // For unpaid installments, create a basic payment object
      if (installment.status !== 'paid') {
        const basicPayment: Payment = {
          id: installment.id,
          status: installment.status,
          amount: installment.amount,
          clinicId: installment.planId.split('-')[0] || '',
          date: installment.dueDate,
          patientName: 'Patient', // Will be updated from plan data
          netAmount: installment.amount,
          paymentMethod: installment.manualPayment ? 'manual' : 'none',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`,
          type: 'payment_plan'
        };
        
        setPaymentData(basicPayment);
        setShowPaymentDetails(true);
        return;
      }
      
      // Fetch payment details for paid installments
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
