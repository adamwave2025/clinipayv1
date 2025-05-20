
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Verify and update the Stripe connection status for a clinic
 * @param clinicId The ID of the clinic to verify
 * @returns A promise that resolves to an object with the verification result
 */
export async function verifyStripeConnectionStatus(clinicId: string): Promise<{
  success: boolean;
  connected: boolean;
  status: string;
  message: string;
}> {
  try {
    // Get the clinic data
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('stripe_account_id, stripe_status')
      .eq('id', clinicId)
      .single();
    
    if (clinicError) {
      console.error('Error fetching clinic data:', clinicError);
      return {
        success: false,
        connected: false,
        status: 'error',
        message: 'Failed to fetch clinic data'
      };
    }
    
    // If there's no Stripe account ID, the clinic is not connected
    if (!clinic?.stripe_account_id) {
      return {
        success: true,
        connected: false,
        status: 'not_connected',
        message: 'Stripe account not connected'
      };
    }
    
    // If the clinic has a Stripe account but status doesn't match, verify with the API
    if (clinic.stripe_account_id && (clinic.stripe_status !== 'connected' || !clinic.stripe_status)) {
      // Check the account status with Stripe API
      const { data: accountData, error: accountError } = await supabase.functions.invoke('connect-onboarding', {
        body: { action: 'check_account_status', accountId: clinic.stripe_account_id }
      });
      
      if (accountError) {
        console.error('Error checking Stripe account status:', accountError);
        return {
          success: false,
          connected: false,
          status: clinic.stripe_status || 'unknown',
          message: 'Failed to verify Stripe connection'
        };
      }
      
      // If charges are enabled, the account is fully set up
      const isConnected = accountData?.charges_enabled === true;
      const newStatus = isConnected ? 'connected' : 'pending';
      
      // If the status has changed, update it in the database
      if (newStatus !== clinic.stripe_status) {
        const { error: updateError } = await supabase
          .from('clinics')
          .update({ stripe_status: newStatus })
          .eq('id', clinicId);
        
        if (updateError) {
          console.error('Error updating clinic stripe status:', updateError);
        } else {
          console.log(`Updated clinic ${clinicId} Stripe status to: ${newStatus}`);
        }
      }
      
      return {
        success: true,
        connected: isConnected,
        status: newStatus,
        message: isConnected 
          ? 'Stripe account is fully connected'
          : 'Stripe onboarding process is incomplete'
      };
    }
    
    // If the status is already set to connected, return that
    return {
      success: true,
      connected: clinic.stripe_status === 'connected',
      status: clinic.stripe_status || 'unknown',
      message: clinic.stripe_status === 'connected'
        ? 'Stripe account is connected'
        : 'Stripe connection is pending completion'
    };
    
  } catch (error: any) {
    console.error('Error verifying Stripe connection:', error);
    toast.error('Failed to verify Stripe connection');
    
    return {
      success: false,
      connected: false,
      status: 'error',
      message: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Utility function to update the Stripe connection status for a clinic
 * Can be called periodically or when needed to ensure status is accurate
 */
export async function refreshStripeConnectionStatus(clinicId: string): Promise<boolean> {
  try {
    const result = await verifyStripeConnectionStatus(clinicId);
    return result.success && result.connected;
  } catch (error) {
    console.error('Error refreshing Stripe connection status:', error);
    return false;
  }
}
