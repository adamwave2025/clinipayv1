
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define a proper return type for the fetchPayments function
interface PaymentFetchResult {
  paymentsData: any[];
  requestsData: any[];
}

export function usePaymentFetcher(
  setIsLoadingPayments: (isLoading: boolean) => void
) {
  const { user } = useAuth();

  const fetchPayments = async (): Promise<PaymentFetchResult> => {
    if (!user) return { paymentsData: [], requestsData: [] };

    setIsLoadingPayments(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData.clinic_id) return { paymentsData: [], requestsData: [] };

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

      return { 
        paymentsData: paymentsData || [], 
        requestsData: requestsData || [] 
      };
    } catch (error) {
      console.error('Error fetching payments data:', error);
      return { paymentsData: [], requestsData: [] };
    } finally {
      setIsLoadingPayments(false);
    }
  };

  return { fetchPayments };
}
