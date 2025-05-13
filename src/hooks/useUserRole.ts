
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_USER_KEY = 'user_role_cache_user';
const ROLE_CACHE_EXPIRY_KEY = 'user_role_cache_expiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const DEFAULT_ROLE = 'clinic'; // Default role if we can't determine it

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(() => {
    // Initialize from cache if available and not expired
    try {
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      const cachedUserId = localStorage.getItem(ROLE_CACHE_USER_KEY);
      const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
      
      // If we have a cached role that's not expired and matches the current user
      if (cachedRole && expiry > Date.now() && cachedUserId === user?.id) {
        console.log('Using cached role:', cachedRole);
        return cachedRole;
      }
    } catch (e) {
      console.warn('Error reading role from cache:', e);
    }
    return null;
  });
  
  const [loading, setLoading] = useState(!role); // Only start loading if no cached role
  const [initialFetchComplete, setInitialFetchComplete] = useState(!!role); // Mark as complete if we have cached role
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Create a utility function to update cache
  const updateRoleCache = useCallback((userId: string, roleValue: string) => {
    try {
      localStorage.setItem(ROLE_CACHE_KEY, roleValue);
      localStorage.setItem(ROLE_CACHE_USER_KEY, userId);
      localStorage.setItem(ROLE_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
      console.log('Updated role cache:', { userId, role: roleValue });
    } catch (e) {
      console.warn('Error setting role cache:', e);
    }
  }, []);

  // Clear cache when user changes
  const clearRoleCache = useCallback(() => {
    try {
      localStorage.removeItem(ROLE_CACHE_KEY);
      localStorage.removeItem(ROLE_CACHE_USER_KEY);
      localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
      console.log('Cleared role cache');
    } catch (e) {
      console.warn('Error clearing role cache:', e);
    }
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      // Don't fetch too frequently
      const now = Date.now();
      if (now - lastFetchTime < 2000 && fetchAttempts > 0) { // 2 second cooldown
        console.log('Skipping role fetch, too soon since last attempt');
        return;
      }
      
      setLastFetchTime(now);
      setFetchAttempts(prev => prev + 1);
      
      if (!user) {
        setRole(null);
        setLoading(false);
        clearRoleCache();
        setInitialFetchComplete(true);
        return;
      }

      // If we already have a cached role for this user, don't fetch again
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      const cachedUserId = localStorage.getItem(ROLE_CACHE_USER_KEY);
      const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
      
      if (cachedRole && expiry > Date.now() && cachedUserId === user.id) {
        console.log('Using cached role from storage:', cachedRole);
        setRole(cachedRole);
        setLoading(false);
        setInitialFetchComplete(true);
        return;
      }

      try {
        console.log('Fetching user role from database...');
        setLoading(true);
        
        // Query the users table to get the role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          
          if (fetchAttempts > 3) {
            // After multiple attempts, fall back to a default role
            console.warn(`Falling back to default role (${DEFAULT_ROLE}) after ${fetchAttempts} failed attempts`);
            setRole(DEFAULT_ROLE);
            // Cache the fallback role but with a shorter expiry
            updateRoleCache(user.id, DEFAULT_ROLE);
          } else if (cachedRole) {
            // If we have any cached role, use it even if expired
            console.log('Using expired cached role as fallback:', cachedRole);
            setRole(cachedRole);
          } else {
            // Last resort fallback
            setRole(DEFAULT_ROLE);
          }
        } else {
          const fetchedRole = data?.role || DEFAULT_ROLE;
          console.log('Successfully fetched role from database:', fetchedRole);
          setRole(fetchedRole);
          
          // Update the cache with the fetched role
          updateRoleCache(user.id, fetchedRole);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        
        // Use cached value as fallback even if expired
        if (cachedRole) {
          console.log('Using expired cached role after fetch error:', cachedRole);
          setRole(cachedRole);
        } else {
          setRole(DEFAULT_ROLE);
        }
      } finally {
        setLoading(false);
        setInitialFetchComplete(true);
      }
    };

    // Use a timer to ensure we don't flood with requests
    const timerId = setTimeout(fetchUserRole, 100);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [user?.id, clearRoleCache, updateRoleCache, fetchAttempts, lastFetchTime]);

  return { role, loading, initialFetchComplete };
}
