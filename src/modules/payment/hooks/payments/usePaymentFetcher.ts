
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

      return data as Payment[];
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
