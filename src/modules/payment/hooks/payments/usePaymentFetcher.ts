
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Payment } from '../../types/payment';

export function usePaymentFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async (clinicId: string, filters?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching payments for clinic:', clinicId, 'with filters:', filters);
      let query = supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters) {
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.search) {
          query = query.or(`patient_name.ilike.%${filters.search}%,patient_email.ilike.%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        throw new Error(error.message);
      }

      // Map the database fields directly to our Payment interface
      const mappedPayments = data.map((payment: any) => ({
        id: payment.id,
        amount_paid: payment.amount_paid || 0,
        clinic_id: payment.clinic_id,
        paid_at: payment.paid_at || payment.created_at,
        patient_name: payment.patient_name,
        patient_email: payment.patient_email,
        patient_phone: payment.patient_phone,
        status: payment.status,
        refund_amount: payment.refund_amount,
        net_amount: payment.net_amount,
        payment_ref: payment.payment_ref,
        stripe_payment_id: payment.stripe_payment_id,
        payment_link_id: payment.payment_link_id,
        patient_id: payment.patient_id,
        payment_schedule_id: payment.payment_schedule_id,
        manual_payment: payment.manual_payment
      })) as Payment[];
      
      return mappedPayments;
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to fetch payment data');
      toast.error('Failed to load payment data');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchPayments,
    isLoading,
    error
  };
}
