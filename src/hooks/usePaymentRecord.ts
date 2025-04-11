
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePaymentRecord() {
  
  // This function is purely for client-side records and UI feedback
  // The actual database updates are handled by the webhook
  const createPaymentRecord = async ({
    paymentIntent,
    linkData,
    formData,
    paymentReference,
    associatedPaymentLinkId
  }: {
    paymentIntent: any;
    linkData: any;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
    paymentReference: string;
    associatedPaymentLinkId: string | null;
  }) => {
    try {
      console.log('Client-side payment success recorded');
      console.log('Payment intent ID:', paymentIntent.id);
      console.log('Payment reference:', paymentReference);
      
      // Note: All database updates are handled by the stripe-webhooks function
      // This function only provides client-side feedback
      
      return { success: true };
    } catch (error: any) {
      console.error('Error in client-side payment recording:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    createPaymentRecord
  };
}
