
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePaymentRecord() {
  
  // This function is now primarily for UI feedback and client-side records
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
      console.log('Processing successful payment client-side');
      console.log('Payment intent ID:', paymentIntent.id);
      console.log('Payment reference:', paymentReference);
      
      // If this was a payment request, check if we need to update some UI state
      if (linkData.isRequest) {
        console.log('This was a payment request. Webhook will handle payment_requests table update.');
        return { success: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error in createPaymentRecord:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    createPaymentRecord
  };
}
