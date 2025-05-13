
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_EXPIRY_KEY = 'user_role_cache_expiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(() => {
    // Initialize from cache if available and not expired
    try {
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
      
      if (cachedRole && expiry > Date.now()) {
        return cachedRole;
      }
    } catch (e) {
      console.warn('Error reading role from cache:', e);
    }
    return null;
  });
  
  const [loading, setLoading] = useState(!role); // Only start loading if no cached role
  const [initialFetchComplete, setInitialFetchComplete] = useState(!!role); // Mark as complete if we have cached role

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        // Clear cache when user logs out
        try {
          localStorage.removeItem(ROLE_CACHE_KEY);
          localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
        } catch (e) {
          console.warn('Error clearing role cache:', e);
        }
        setInitialFetchComplete(true);
        return;
      }

      // If we already have a cached role for this user, don't fetch again
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
      
      if (cachedRole && expiry > Date.now()) {
        setRole(cachedRole);
        setLoading(false);
        setInitialFetchComplete(true);
        return;
      }

      try {
        // Query the users table to get the role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Don't reset role to null if we have a cached role
          if (!cachedRole) {
            setRole('clinic'); // Default to 'clinic' if error fetching
          }
        } else {
          const fetchedRole = data?.role || 'clinic'; // Default to 'clinic' if no role is set
          setRole(fetchedRole);
          
          // Update the cache with expiry time
          try {
            localStorage.setItem(ROLE_CACHE_KEY, fetchedRole);
            localStorage.setItem(ROLE_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
          } catch (e) {
            console.warn('Error setting role cache:', e);
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        // Don't reset role to null if we have a cached role
        if (!cachedRole) {
          setRole('clinic'); // Default to 'clinic' if error
        }
      } finally {
        setLoading(false);
        setInitialFetchComplete(true);
      }
    };

    fetchUserRole();
  }, [user?.id]); // Only refetch when user ID changes, not on every user object change

  return { role, loading, initialFetchComplete };
}
