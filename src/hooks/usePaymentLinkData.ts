
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentLinkData {
  id: string;
  title: string;
  amount: number;
  type: string;
  clinic: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export function usePaymentLinkData(linkId: string | undefined) {
  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkData = async () => {
      if (!linkId) {
        setIsLoading(false);
        setError('No payment link ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch payment link details
        const { data: linkData, error: linkError } = await supabase
          .from('payment_links')
          .select(`
            id, 
            title, 
            amount, 
            type, 
            clinic_id, 
            clinics:clinic_id (
              id, 
              clinic_name, 
              logo_url, 
              email, 
              phone, 
              address_line_1, 
              address_line_2, 
              city, 
              postcode
            )
          `)
          .eq('id', linkId)
          .single();

        if (linkError) {
          throw new Error(linkError.message);
        }

        if (!linkData) {
          throw new Error('Payment link not found');
        }

        // Format clinic address
        const addressParts = [
          linkData.clinics.address_line_1,
          linkData.clinics.address_line_2,
          linkData.clinics.city,
          linkData.clinics.postcode
        ].filter(Boolean);
        
        const address = addressParts.join(', ');

        setLinkData({
          id: linkData.id,
          title: linkData.title || '',
          amount: linkData.amount || 0,
          type: linkData.type || 'other',
          clinic: {
            id: linkData.clinics.id,
            name: linkData.clinics.clinic_name || 'Clinic',
            logo: linkData.clinics.logo_url || undefined,
            email: linkData.clinics.email || undefined,
            phone: linkData.clinics.phone || undefined,
            address: address || undefined
          }
        });
      } catch (error: any) {
        console.error('Error fetching payment link:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkData();
  }, [linkId]);

  return {
    linkData,
    isLoading,
    error
  };
}
