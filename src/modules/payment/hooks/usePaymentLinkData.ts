
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentLinkData } from '../types/paymentLink';
import { PaymentLinkFormatter } from '@/services/payment-link/PaymentLinkFormatter';

export function usePaymentLinkData(paymentLinkId: string | null) {
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaymentLink() {
      if (!paymentLinkId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('payment_links')
          .select(`
            *,
            clinics:clinic_id (
              id,
              clinic_name,
              logo_url,
              email,
              phone,
              address_line_1,
              address_line_2,
              city,
              postcode,
              country
            )
          `)
          .eq('id', paymentLinkId)
          .single();

        if (error) {
          throw error;
        }

        // Use the PaymentLinkFormatter to properly format the raw data
        const formattedData = PaymentLinkFormatter.formatPaymentLink(data);
        if (!formattedData) {
          throw new Error('Failed to format payment link data');
        }

        setPaymentLink(formattedData);
      } catch (err: any) {
        console.error('Error fetching payment link:', err);
        setError(err.message || 'Failed to fetch payment link');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaymentLink();
  }, [paymentLinkId]);

  return { paymentLink, linkData: paymentLink, isLoading, error };
}
