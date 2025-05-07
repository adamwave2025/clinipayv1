
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { toast } from 'sonner';

export const usePaymentDetailsFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);

  const fetchPaymentDetails = async (installment: PlanInstallment) => {
    setIsLoading(true);
    
    try {
      // If there is no payment request ID, we can't fetch payment details
      if (!installment.paymentRequestId) {
        console.log('No payment request ID found for this installment');
        toast.error('No payment information available');
        return null;
      }
      
      // First get the payment request details
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select(`
          id, payment_id, patient_name, patient_email, patient_phone,
          payments (*)
        `)
        .eq('id', installment.paymentRequestId)
        .single();
      
      if (requestError) {
        console.error('Error fetching payment request:', requestError);
        toast.error('Failed to load payment details');
        return null;
      }
      
      // Extract payment information from the request
      const paymentInfo = requestData.payments ? {
        ...requestData.payments,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone
      } : null;
      
      setPaymentData(paymentInfo);
      return paymentInfo;
      
    } catch (error) {
      console.error('Error in fetchPaymentDetails:', error);
      toast.error('Failed to load payment details');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    paymentData,
    fetchPaymentDetails
  };
};
