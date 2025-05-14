
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserDataState {
  role: string | null;
  clinicId: string | null;
  loading: boolean;
  error: Error | null;
  isReady: boolean;
}

/**
 * Hook to fetch user role and clinic data from the database
 * Only activates when a valid user is provided
 */
export function useUserData(user: User | null): UserDataState {
  const [state, setState] = useState<UserDataState>({
    role: null,
    clinicId: null,
    loading: Boolean(user), // Only set loading true if user exists
    error: null,
    isReady: !user, // Ready immediately if no user (nothing to load)
  });

  useEffect(() => {
    let mounted = true;

    // Reset state when user changes
    setState(prevState => ({
      ...prevState,
      role: null,
      clinicId: null,
      loading: Boolean(user),
      error: null,
      isReady: !user,
    }));

    // Only fetch data if we have a user
    if (!user) {
      return;
    }

    console.log(`[USER DATA] Fetching data for user: ${user.id}`);

    const fetchUserData = async () => {
      try {
        // Fetch user role and clinic ID in a single query for efficiency
        const { data, error } = await supabase
          .from('users')
          .select('role, clinic_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        console.log(`[USER DATA] Data fetched: role=${data?.role}, clinicId=${data?.clinic_id}`);

        if (mounted) {
          setState({
            role: data?.role || null,
            clinicId: data?.clinic_id || null,
            loading: false,
            error: null,
            isReady: true,
          });
        }
      } catch (error) {
        console.error('[USER DATA] Error fetching user data:', error);
        
        if (mounted) {
          setState({
            role: null,
            clinicId: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to fetch user data'),
            isReady: true, // Mark as ready even on error - we tried and failed
          });
        }
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only re-run if user ID changes

  return state;
}
