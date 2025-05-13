
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Debug setting - can be enabled via localStorage
const DEBUG_ROLES = localStorage.getItem('DEBUG_ROLES') === 'true' || false;

// Cache configuration
const ROLE_CACHE_KEY = 'user_role_cache';
const ROLE_CACHE_USER_KEY = 'user_role_cache_user';
const ROLE_CACHE_EXPIRY_KEY = 'user_role_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // Extended to 24 hours
const DEFAULT_ROLE = 'clinic'; // Default role if we can't determine it
const MAX_RETRIES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60 * 1000; // 60 seconds
const RETRY_DELAY_BASE = 1000; // Base delay of 1 second

export function useUserRole() {
  const { user, debugMode } = useAuth();
  const [role, setRole] = useState<string | null>(() => {
    // Initialize from cache if available and not expired
    try {
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY);
      const cachedUserId = localStorage.getItem(ROLE_CACHE_USER_KEY);
      const expiryStr = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
      
      // If we have a cached role that's not expired and matches the current user
      if (cachedRole && expiry > Date.now() && cachedUserId === user?.id) {
        const logMsg = `Using cached role: ${cachedRole} (expires in ${Math.floor((expiry - Date.now()) / 60000)}min)`;
        if (DEBUG_ROLES) console.log(`🔑 ${logMsg}`);
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
  
  // Track if circuit breaker is active (to prevent too many failed requests)
  const circuitBreakerRef = useRef({
    isTripped: false,
    trippedAt: 0,
    consecutiveErrors: 0,
    lastErrorMessage: '',
    fallbackRoleUsed: false
  });

  // Debug logging function
  const logRoleEvent = (action: string, details?: any) => {
    if (DEBUG_ROLES || debugMode) {
      console.group(`🔑 Role Event: ${action}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`User: ${user?.id || 'none'}`);
      console.log(`Current Role: ${role || 'none'}`);
      console.log(`Network: ${navigator.onLine ? 'Online' : 'Offline'}`);
      if (details) console.log('Details:', details);
      console.groupEnd();
    }
  };

  // Create a utility function to update cache
  const updateRoleCache = useCallback((userId: string, roleValue: string) => {
    try {
      const expiry = Date.now() + CACHE_DURATION;
      localStorage.setItem(ROLE_CACHE_KEY, roleValue);
      localStorage.setItem(ROLE_CACHE_USER_KEY, userId);
      localStorage.setItem(ROLE_CACHE_EXPIRY_KEY, expiry.toString());
      
      logRoleEvent('Updated role cache', { 
        userId, 
        role: roleValue, 
        expiresAt: new Date(expiry).toISOString()
      });
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
      logRoleEvent('Cleared role cache');
    } catch (e) {
      console.warn('Error clearing role cache:', e);
    }
  }, []);

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    const cb = circuitBreakerRef.current;
    if (cb.isTripped) {
      logRoleEvent('Resetting circuit breaker', {
        wasTrippedFor: Math.floor((Date.now() - cb.trippedAt) / 1000) + 's'
      });
    }
    
    cb.isTripped = false;
    cb.trippedAt = 0;
    cb.consecutiveErrors = 0;
    cb.lastErrorMessage = '';
  }, []);

  // Trip the circuit breaker
  const tripCircuitBreaker = useCallback((errorMessage: string) => {
    const cb = circuitBreakerRef.current;
    cb.isTripped = true;
    cb.trippedAt = Date.now();
    cb.consecutiveErrors++;
    cb.lastErrorMessage = errorMessage;
    
    logRoleEvent('Circuit breaker tripped', {
      consecutiveErrors: cb.consecutiveErrors,
      error: errorMessage
    });
    
    // Auto-reset after timeout
    setTimeout(() => {
      if (cb.isTripped) {
        resetCircuitBreaker();
      }
    }, CIRCUIT_BREAKER_TIMEOUT);
  }, [resetCircuitBreaker]);
  
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
      logRoleEvent('Using valid cached role', { 
        role: cachedRole, 
        expiresIn: Math.floor((expiry - Date.now()) / 60000) + ' minutes' 
      });
      return;
    }
    
    const fetchUserRole = async () => {
      // Don't fetch too frequently
      const now = Date.now();
      if (now - lastFetchTime < 2000 && fetchAttempts > 0) { // 2 second cooldown
        logRoleEvent('Skipping role fetch, too soon since last attempt', {
          timeSinceLastFetch: now - lastFetchTime + 'ms',
          attempts: fetchAttempts
        });
        return;
      }
      
      // Check for circuit breaker
      if (circuitBreakerRef.current.isTripped) {
        const timeTripped = Date.now() - circuitBreakerRef.current.trippedAt;
        if (timeTripped < CIRCUIT_BREAKER_TIMEOUT) {
          logRoleEvent('Circuit breaker active, using cached or default role', {
            trippedFor: Math.floor(timeTripped / 1000) + 's',
            maxTrippedTime: Math.floor(CIRCUIT_BREAKER_TIMEOUT / 1000) + 's',
            cachedRoleAvailable: !!cachedRole && cachedUserId === user?.id
          });
          
          // Use cached role even if expired, or default
          if (cachedRole && cachedUserId === user?.id) {
            setRole(cachedRole);
          } else {
            setRole(DEFAULT_ROLE);
          }
          setLoading(false);
          setInitialFetchComplete(true);
          return;
        } else {
          // Circuit breaker timeout expired, reset it
          resetCircuitBreaker();
        }
      }
      
      setLastFetchTime(now);
      setFetchAttempts(prev => prev + 1);
      
      if (!user) {
        logRoleEvent('No user, clearing role');
        setRole(null);
        setLoading(false);
        clearRoleCache();
        setInitialFetchComplete(true);
        return;
      }

      // Always use a cached role for this user if available, regardless of expiry
      if (cachedRole && cachedUserId === user.id) {
        logRoleEvent('Using cached role while fetching fresh data', { 
          role: cachedRole,
          expired: expiry < Date.now()
        });
        
        setRole(cachedRole);
        setLoading(false);
        setInitialFetchComplete(true);
        
        // Continue with fetch to update cache in background, but don't block UI
        if (expiry < Date.now()) {
          logRoleEvent('Cached role expired, refreshing in background');
        }
      }

      try {
        logRoleEvent('Fetching user role from database', { userId: user.id, attempt: fetchAttempts });
        setLoading(true);
        
        // Query the users table to get the role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          logRoleEvent('Error fetching user role', { error, attempts: fetchAttempts });
          
          // Increment circuit breaker error count
          circuitBreakerRef.current.consecutiveErrors++;
          
          // Trip circuit breaker if too many consecutive errors
          if (circuitBreakerRef.current.consecutiveErrors >= 3) {
            tripCircuitBreaker(error.message);
          }
          
          // Handle network errors more gracefully
          if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
            logRoleEvent('Network error detected, using fallback role', { 
              networkStatus: navigator.onLine ? 'Reported online but request failed' : 'Offline',
              cachedRoleAvailable: !!cachedRole && cachedUserId === user.id
            });
            
            // Use cached role for this user even if expired
            if (cachedRole && cachedUserId === user.id) {
              setRole(cachedRole);
              // Extend the expiry time even though it's potentially stale
              updateRoleCache(user.id, cachedRole);
            } else if (fetchAttempts > MAX_RETRIES) {
              // Last resort
              setRole(DEFAULT_ROLE);
              updateRoleCache(user.id, DEFAULT_ROLE);
              circuitBreakerRef.current.fallbackRoleUsed = true;
              
              if (fetchAttempts === MAX_RETRIES + 1) {
                // Only show this message once to avoid spamming
                toast.error('Network connectivity issues detected. Using default permissions.');
              }
            }
          } else if (fetchAttempts > MAX_RETRIES) {
            logRoleEvent(`Falling back to default role after ${fetchAttempts} failed attempts`);
            setRole(DEFAULT_ROLE);
            // Cache with short expiry
            updateRoleCache(user.id, DEFAULT_ROLE);
            circuitBreakerRef.current.fallbackRoleUsed = true;
          } else if (cachedRole && cachedUserId === user.id) {
            // Use cached role even if expired
            logRoleEvent('Using expired cached role as fallback');
            setRole(cachedRole);
            // Don't update expiry
          } else {
            // Last resort fallback
            setRole(DEFAULT_ROLE);
          }
        } else {
          const fetchedRole = data?.role || DEFAULT_ROLE;
          logRoleEvent('Successfully fetched role from database', { 
            fetchedRole,
            attempts: fetchAttempts 
          });
          
          setRole(fetchedRole);
          
          // Update the cache with the fetched role
          updateRoleCache(user.id, fetchedRole);
          
          // Reset circuit breaker and fetch attempts on success
          resetCircuitBreaker();
          setFetchAttempts(0);
        }
      } catch (error: any) {
        logRoleEvent('Unexpected error fetching user role', { error });
        
        // Trip circuit breaker
        tripCircuitBreaker(error.message || 'Unknown error');
        
        // Use cached value as fallback even if expired
        if (cachedRole && cachedUserId === user.id) {
          logRoleEvent('Using cached role after fetch error');
          setRole(cachedRole);
        } else {
          setRole(DEFAULT_ROLE);
          circuitBreakerRef.current.fallbackRoleUsed = true;
          
          // Only toast on first fallback to avoid spamming
          if (!circuitBreakerRef.current.fallbackRoleUsed) {
            toast.error('Error retrieving your account type. Using default permissions.');
            circuitBreakerRef.current.fallbackRoleUsed = true;
          }
        }
      } finally {
        setLoading(false);
        setInitialFetchComplete(true);
      }
    };

    // Fetch immediately the first time, then add a small delay for retries
    const delay = fetchAttempts === 0 ? 0 : Math.min(RETRY_DELAY_BASE * Math.pow(1.5, fetchAttempts-1), 10000);
    
    logRoleEvent('Scheduling role fetch', { 
      delay: delay + 'ms', 
      attempt: fetchAttempts + 1,
      circuitBreakerStatus: circuitBreakerRef.current.isTripped ? 'tripped' : 'ok'
    });
    
    const timerId = setTimeout(fetchUserRole, delay);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [
    user?.id,
    clearRoleCache,
    updateRoleCache,
    fetchAttempts,
    lastFetchTime,
    resetCircuitBreaker,
    tripCircuitBreaker
  ]);

  return { 
    role, 
    loading, 
    initialFetchComplete, 
    circuitBreakerActive: circuitBreakerRef.current.isTripped 
  };
}
