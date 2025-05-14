
import { supabase } from '@/integrations/supabase/client';

export const PaymentLinkService = {
  /**
   * Fetch payment link details by ID
   */
  async fetchPaymentLinkDetails(paymentLinkId: string) {
    const { data: linkData, error: linkError } = await supabase
      .from('payment_links')
      .select('amount, title, payment_plan')
      .eq('id', paymentLinkId)
      .single();
        
    if (linkError || !linkData) {
      console.error('⚠️ CRITICAL ERROR: Error fetching payment link details:', linkError);
      throw new Error('Could not find the selected payment link');
    }
      
    return linkData;
  }
};
