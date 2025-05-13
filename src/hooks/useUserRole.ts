
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CACHE_KEY = 'user_role_cache';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        localStorage.removeItem(ROLE_CACHE_KEY);
        return;
      }

      // Check if we have a cached role first
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      if (cachedRole) {
        setRole(cachedRole);
        // Still fetch from the database to ensure we have the latest role
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
          // Update the cache
          localStorage.setItem(ROLE_CACHE_KEY, fetchedRole);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        // Don't reset role to null if we have a cached role
        if (!cachedRole) {
          setRole('clinic'); // Default to 'clinic' if error
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
}
