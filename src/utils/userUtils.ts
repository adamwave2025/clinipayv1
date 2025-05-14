
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Safely fetches the clinic ID associated with the authenticated user
 * This version includes better error handling and logging
 * 
 * @returns Promise with the clinic ID or null if not found
 */
export async function getUserClinicId(): Promise<string | null> {
  try {
    console.log('[USER UTILS] Fetching current user clinic ID');
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[USER UTILS] Error getting authenticated user:', userError);
      return null;
    }
    
    console.log('[USER UTILS] Found user, fetching clinic ID');
    
    // Fetch the user's record from the users table to get the clinic_id
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('[USER UTILS] Error fetching clinic ID:', error);
      return null;
    }
    
    console.log('[USER UTILS] Found clinic ID:', data.clinic_id);
    return data.clinic_id;
  } catch (error) {
    console.error('[USER UTILS] Unexpected error in getUserClinicId:', error);
    return null;
  }
}

/**
 * Safely gets the authenticated user
 * Includes better error handling and logging
 */
export async function getAuthenticatedUser(): Promise<{user: any | null, error: any | null}> {
  try {
    console.log('[USER UTILS] Fetching authenticated user');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[USER UTILS] Error getting authenticated user:', error);
      return { user: null, error };
    }
    
    console.log('[USER UTILS] User authentication checked, found:', data.user?.id || 'no user');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('[USER UTILS] Unexpected error getting authenticated user:', error);
    return { user: null, error };
  }
}

/**
 * Safely fetches the user role
 * This provides a more direct way to get just the role when needed
 */
export async function getUserRole(): Promise<string | null> {
  try {
    console.log('[USER UTILS] Fetching user role');
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[USER UTILS] Error getting authenticated user:', userError);
      return null;
    }
    
    // Fetch the user's role
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('[USER UTILS] Error fetching user role:', error);
      return null;
    }
    
    console.log('[USER UTILS] Found role:', data.role);
    return data.role;
  } catch (error) {
    console.error('[USER UTILS] Unexpected error in getUserRole:', error);
    return null;
  }
}
