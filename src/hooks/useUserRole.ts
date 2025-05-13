
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_USER_KEY = 'user_role_cache_user';
const ROLE_CACHE_EXPIRY_KEY = 'user_role_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // Extended to 24 hours
const DEFAULT_ROLE = 'clinic'; // Default role if we can't determine it
const MAX_RETRIES = 5;

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
  
  // Get role with more aggressive caching and offline resilience
  useEffect(() => {
    // Skip if we already have a valid role and user ID match
    const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
    const cachedUserId = localStorage.getItem(ROLE_CACHE_USER_KEY);
    const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
    
    if (cachedRole && cachedUserId === user?.id && expiry > Date.now()) {
      setRole(cachedRole);
      setLoading(false);
      setInitialFetchComplete(true);
      return;
    }
    
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

      // Always use a cached role for this user if available, regardless of expiry
      if (cachedRole && cachedUserId === user.id) {
        console.log('Using cached role, might be expired but matches current user:', cachedRole);
        setRole(cachedRole);
        setLoading(false);
        setInitialFetchComplete(true);
        
        // Continue with fetch to update cache in background, but don't block UI
        if (expiry < Date.now()) {
          console.log('Cached role expired, refreshing in background');
        }
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
          
          // Handle network errors more gracefully
          if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
            console.warn('Network error detected, using fallback role');
            
            // Use cached role for this user even if expired
            if (cachedRole && cachedUserId === user.id) {
              setRole(cachedRole);
              // Extend the expiry time even though it's potentially stale
              updateRoleCache(user.id, cachedRole);
            } else if (fetchAttempts > MAX_RETRIES) {
              // Last resort
              setRole(DEFAULT_ROLE);
              updateRoleCache(user.id, DEFAULT_ROLE);
            }
          } else if (fetchAttempts > MAX_RETRIES) {
            console.warn(`Falling back to default role (${DEFAULT_ROLE}) after ${fetchAttempts} failed attempts`);
            setRole(DEFAULT_ROLE);
            // Cache with short expiry
            updateRoleCache(user.id, DEFAULT_ROLE);
          } else if (cachedRole && cachedUserId === user.id) {
            // Use cached role even if expired
            console.log('Using expired cached role as fallback:', cachedRole);
            setRole(cachedRole);
            // Don't update expiry
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
          
          // Reset fetch attempts on success
          setFetchAttempts(0);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        
        // Use cached value as fallback even if expired
        if (cachedRole && cachedUserId === user.id) {
          console.log('Using cached role after fetch error:', cachedRole);
          setRole(cachedRole);
        } else {
          setRole(DEFAULT_ROLE);
        }
      } finally {
        setLoading(false);
        setInitialFetchComplete(true);
      }
    };

    // Fetch immediately the first time, then add a small delay for retries
    const delay = fetchAttempts === 0 ? 0 : Math.min(fetchAttempts * 1000, 5000);
    const timerId = setTimeout(fetchUserRole, delay);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [user?.id, clearRoleCache, updateRoleCache, fetchAttempts, lastFetchTime]);

  return { role, loading, initialFetchComplete };
}
