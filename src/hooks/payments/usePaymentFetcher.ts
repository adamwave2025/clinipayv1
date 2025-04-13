
import { useEffect } from 'react';
import { PaymentLink } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';

export function usePaymentFetcher(
  setIsLoadingPayments: (isLoading: boolean) => void,
  paymentLinks: PaymentLink[] = []
) {
  const { user } = useAuth();

  const fetchPayments = async () => {
    if (!user) return [];

    setIsLoadingPayments(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData.clinic_id) return [];

      // Fetch completed payments with payment_link_id
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          payment_links(id, type, title, description)
        `)
        .eq('clinic_id', userData.clinic_id)
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch sent payment requests with payment_link_id
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          payment_links(id, type, title, description)
        `)
        .eq('clinic_id', userData.clinic_id)
        .is('paid_at', null) // Only get unpaid/sent requests
        .order('sent_at', { ascending: false });

      if (requestsError) throw requestsError;

      return { paymentsData, requestsData };
    } catch (error) {
      console.error('Error fetching payments data:', error);
      return { paymentsData: [], requestsData: [] };
    } finally {
      setIsLoadingPayments(false);
    }
  };

  return { fetchPayments };
}
