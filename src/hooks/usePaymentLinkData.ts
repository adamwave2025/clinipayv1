
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentLinkData {
  id: string;
  title: string;
  amount: number;
  type: string;
  description?: string;
  clinic: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    stripeStatus?: string;
  };
  isRequest?: boolean;
  customAmount?: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
}

export function usePaymentLinkData(linkId: string | undefined | null) {
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
        // First, try to see if this is a payment request
        const { data: requestData, error: requestError } = await supabase
          .from('payment_requests')
          .select(`
            id, 
            custom_amount,
            patient_name,
            patient_email,
            patient_phone,
            payment_link_id,
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
              postcode,
              stripe_status
            )
          `)
          .eq('id', linkId)
          .single();

        // If we found a payment request
        if (requestData && !requestError) {
          console.log('Found payment request:', requestData);
          
          let title = 'Payment Request';
          let amount = requestData.custom_amount || 0;
          let type = 'other';
          
          // If request is linked to a payment link, try to get its details
          if (requestData.payment_link_id) {
            const { data: linkData } = await supabase
              .from('payment_links')
              .select('title, amount, type')
              .eq('id', requestData.payment_link_id)
              .single();
              
            if (linkData) {
              title = linkData.title || 'Payment Request';
              if (!requestData.custom_amount) {
                amount = linkData.amount || 0;
              }
              type = linkData.type || 'other';
            }
          }
          
          // Format clinic address
          const addressParts = [
            requestData.clinics.address_line_1,
            requestData.clinics.address_line_2,
            requestData.clinics.city,
            requestData.clinics.postcode
          ].filter(Boolean);
          
          const address = addressParts.join(', ');

          setLinkData({
            id: requestData.id,
            title: title,
            amount: amount,
            type: type,
            isRequest: true,
            customAmount: requestData.custom_amount,
            patientName: requestData.patient_name,
            patientEmail: requestData.patient_email,
            patientPhone: requestData.patient_phone,
            clinic: {
              id: requestData.clinics.id,
              name: requestData.clinics.clinic_name || 'Clinic',
              logo: requestData.clinics.logo_url || undefined,
              email: requestData.clinics.email || undefined,
              phone: requestData.clinics.phone || undefined,
              address: address || undefined,
              stripeStatus: requestData.clinics.stripe_status || undefined
            }
          });
          
          setIsLoading(false);
          return;
        }
        
        // If not a payment request, try to find as a regular payment link
        const { data: linkData, error: linkError } = await supabase
          .from('payment_links')
          .select(`
            id, 
            title, 
            amount, 
            type, 
            description,
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
              postcode,
              stripe_status
            )
          `)
          .eq('id', linkId)
          .single();

        if (linkError) {
          throw new Error('Payment link or request not found');
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
          description: linkData.description || undefined,
          isRequest: false,
          clinic: {
            id: linkData.clinics.id,
            name: linkData.clinics.clinic_name || 'Clinic',
            logo: linkData.clinics.logo_url || undefined,
            email: linkData.clinics.email || undefined,
            phone: linkData.clinics.phone || undefined,
            address: address || undefined,
            stripeStatus: linkData.clinics.stripe_status || undefined
          }
        });
      } catch (error: any) {
        console.error('Error fetching payment link/request:', error);
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
