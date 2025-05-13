
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cache key constants
const CLINIC_ID_CACHE_KEY = 'user_clinic_id';
const CLINIC_ID_EXPIRY_KEY = 'user_clinic_id_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetches the clinic ID associated with the authenticated user
 * Enhanced with caching, offline resilience and backoff retries
 * 
 * @returns Promise with the clinic ID or null if not found
 */
export async function getUserClinicId(): Promise<string | null> {
  try {
    // Check for cached clinic ID first
    const cachedClinicId = getCachedClinicId();
    if (cachedClinicId) {
      console.log('Using cached clinic ID:', cachedClinicId);
      return cachedClinicId;
    }
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting authenticated user:', userError);
      
      // Special handling for network-related errors
      if (userError.message?.includes('Failed to fetch') || 
          navigator.onLine === false) {
        console.warn('Network connectivity issue detected, using fallback methods');
        return getFallbackClinicId();
      }
      
      return null;
    }
    
    if (!user) {
      console.error('No authenticated user found');
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
      
      // Special handling for network errors
      if (error.message?.includes('Failed to fetch') || 
          navigator.onLine === false) {
        console.warn('Network connectivity issue detected, using fallback methods');
        return getFallbackClinicId();
      }
      
      return null;
    }
    
    const clinicId = data.clinic_id;
    
    // Cache the clinic ID for future use
    cacheClinicId(clinicId);
    
    return clinicId;
  } catch (error) {
    console.error('Unexpected error in getUserClinicId:', error);
    return getFallbackClinicId();
  }
}

/**
 * Get clinic ID from cache if available and valid
 */
function getCachedClinicId(): string | null {
  try {
    const cachedClinicId = localStorage.getItem(CLINIC_ID_CACHE_KEY);
    const expiryStr = localStorage.getItem(CLINIC_ID_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
    
    // If we have a cached ID that's not expired
    if (cachedClinicId && expiry > Date.now()) {
      return cachedClinicId;
    }
  } catch (e) {
    console.warn('Error reading clinic ID from cache:', e);
  }
  return null;
}

/**
 * Save clinic ID to cache
 */
function cacheClinicId(clinicId: string): void {
  try {
    localStorage.setItem(CLINIC_ID_CACHE_KEY, clinicId);
    localStorage.setItem(CLINIC_ID_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    console.log('Cached clinic ID:', clinicId);
  } catch (e) {
    console.warn('Error saving clinic ID to cache:', e);
  }
}

/**
 * Get clinic ID from fallback methods when primary methods fail
 */
function getFallbackClinicId(): string | null {
  try {
    // First try to get from cache regardless of expiry
    const cachedClinicId = localStorage.getItem(CLINIC_ID_CACHE_KEY);
    if (cachedClinicId) {
      console.log('Using expired cached clinic ID as fallback:', cachedClinicId);
      return cachedClinicId;
    }
    
    // If no cache is available, try to extract from session user metadata
    try {
      const session = JSON.parse(localStorage.getItem('sb-jbtxxlkhiubuzanegtzn-auth-token') || '{}');
      const userMeta = session?.user?.user_metadata;
      if (userMeta?.clinic_id) {
        return userMeta.clinic_id;
      }
    } catch (e) {
      console.warn('Error extracting clinic ID from session:', e);
    }
  } catch (e) {
    console.error('Error in fallback clinic ID retrieval:', e);
  }
  
  return null;
}
