
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      // Reset loading state when user changes
      setLoading(true);
      
      if (!user) {
        console.log('useUserRole: No user available, clearing role');
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log(`useUserRole: Fetching role for user ID: ${user.id}`);
        
        // Query the users table to get the role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          const userRole = data?.role || 'clinic'; // Default to 'clinic' if no role is set
          console.log(`useUserRole: Retrieved role: ${userRole}`);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
}
