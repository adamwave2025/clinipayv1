
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BasePaymentLinkService } from './BasePaymentLinkService';

/**
 * Service class for creating and updating payment links
 */
export class PaymentLinkMutationService extends BasePaymentLinkService {
  /**
   * Creates a new payment link
   */
  static async createLink(linkData: any) {
    try {
      // Enhanced logging to debug payment plan issues
      console.log('PaymentLinkService: Creating link with original data:', JSON.stringify(linkData, null, 2));
      
      // Ensure a clinic_id is provided
      if (!linkData.clinic_id) {
        throw new Error('No clinic_id provided');
      }
      
      // Make a copy to prevent modifying original data
      const dataToInsert = { ...linkData };
      
      // CRITICAL FIX: Force payment_plan to true for payment_plan type
      if (dataToInsert.type === 'payment_plan') {
        // Force payment_plan to be boolean true, not a string or anything else
        dataToInsert.payment_plan = true;
        console.log('Forcing payment_plan to TRUE for payment_plan type');
        
        // Ensure all required fields for payment plans are present
        if (!dataToInsert.payment_count || !dataToInsert.payment_cycle) {
          throw new Error('Payment plan requires payment_count and payment_cycle');
        }
      } else {
        // For non-payment plans, explicitly set to false
        dataToInsert.payment_plan = false;
      }
      
      console.log('FINAL DATA TO INSERT:', JSON.stringify(dataToInsert, null, 2));
      
      // Insert data into database with specific type definitions
      const { data, error } = await supabase
        .from('payment_links')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('Supabase error creating payment link:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from payment link creation');
      }
      
      // Verify the payment_plan flag was set correctly
      console.log('DATA RETURNED FROM DB:', JSON.stringify(data, null, 2));
      
      if (dataToInsert.payment_plan === true && data[0].payment_plan !== true) {
        console.error('WARNING: payment_plan was true in request but not true in response!', {
          requestedValue: dataToInsert.payment_plan,
          returnedValue: data[0].payment_plan
        });
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error("Error creating payment link:", error.message);
      toast.error("Failed to create payment link.");
      return { data: null, error: error.message };
    }
  }

  /**
   * Updates an existing payment link
   */
  static async updateLink(linkId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .update(updates)
        .eq('id', linkId)
        .select();
  
      if (error) {
        throw error;
      }
  
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating payment link:", error.message);
      toast.error("Failed to update payment link.");
      return { data: null, error: error.message };
    }
  }
}
