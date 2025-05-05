
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetches the clinic ID associated with the authenticated user
 * 
 * @returns Promise with the clinic ID or null if not found
 */
export async function getUserClinicId(): Promise<string | null> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting authenticated user:', userError);
      return null;
    }
    
    // Fetch the user's record from the users table to get the clinic_id
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching clinic ID:', error);
      return null;
    }
    
    return data.clinic_id;
  } catch (error) {
    console.error('Unexpected error in getUserClinicId:', error);
    return null;
  }
}
