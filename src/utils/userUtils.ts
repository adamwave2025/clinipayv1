
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetches the clinic ID associated with the authenticated user
 * 
 * @param userId Optional userId parameter. If provided, will use that instead of fetching the current user.
 * @returns Promise with the clinic ID or null if not found
 */
export async function getUserClinicId(userId?: string): Promise<string | null> {
  try {
    // Check if a userId was provided directly (preferred)
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      console.log('getUserClinicId: No userId provided, fetching current user');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting authenticated user:', userError);
        return null;
      }
      
      if (!user) {
        console.warn('getUserClinicId: No authenticated user found');
        return null;
      }
      
      userIdToUse = user.id;
    }
    
    console.log(`getUserClinicId: Fetching clinic ID for user: ${userIdToUse}`);
    
    // Fetch the user's record from the users table to get the clinic_id
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userIdToUse)
      .single();
    
    if (error) {
      console.error('Error fetching clinic ID:', error);
      return null;
    }
    
    if (!data || !data.clinic_id) {
      console.error('No clinic ID found for user:', userIdToUse);
      return null;
    }
    
    console.log(`getUserClinicId: Found clinic ID: ${data.clinic_id}`);
    
    return data.clinic_id;
  } catch (error) {
    console.error('Unexpected error in getUserClinicId:', error);
    return null;
  }
}
