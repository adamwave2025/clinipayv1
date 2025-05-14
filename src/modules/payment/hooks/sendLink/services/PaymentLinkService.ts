
import { supabase } from '@/integrations/supabase/client';
import { PaymentLink } from '../../../types/payment';

export const PaymentLinkService = {
  /**
   * Fetch payment link details by ID
   */
  async fetchPaymentLinkDetails(paymentLinkId: string): Promise<PaymentLink | null> {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', paymentLinkId)
        .single();
          
      if (linkError || !linkData) {
        console.error('⚠️ CRITICAL ERROR: Error fetching payment link details:', linkError);
        throw new Error('Could not find the selected payment link');
      }
        
      return linkData as PaymentLink;
    } catch (error) {
      console.error('Error in fetchPaymentLinkDetails:', error);
      return null;
    }
  },

  /**
   * Create a new payment link
   */
  async createLink(paymentLinkData: Partial<PaymentLink>): Promise<PaymentLink | null> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .insert(paymentLinkData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating payment link:', error);
        return null;
      }
      
      return data as PaymentLink;
    } catch (error) {
      console.error('Error in createLink:', error);
      return null;
    }
  }
};
