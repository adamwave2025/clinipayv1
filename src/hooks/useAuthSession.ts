
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthSessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  isReady: boolean;
}

/**
 * Hook to securely manage Supabase authentication session state
 * Follows correct initialization order to prevent race conditions
 */
export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    user: null,
    loading: true,
    error: null,
    isReady: false,
  });

  useEffect(() => {
    let mounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    console.log('[AUTH] Setting up auth session management');

    // Important: Set up the auth state listener FIRST
    const setupAuthListener = async () => {
      try {
        // Set up the auth state listener
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log(`[AUTH] Auth state changed: ${event}`);
          
          // Only update state if component is still mounted
          if (mounted) {
            setState(prevState => ({
              ...prevState,
              session: newSession,
              user: newSession?.user ?? null,
              // Don't set loading to false yet - we're still initializing
            }));
          }
        });
        
        authListener = data;
        return data;
      } catch (error) {
        console.error('[AUTH] Error setting up auth listener:', error);
        if (mounted) {
          setState(prevState => ({ 
            ...prevState, 
            error: error instanceof Error ? error : new Error('Failed to set up auth listener'),
            loading: false,
            isReady: true,
          }));
        }
        return null;
      }
    };

    // Then check for existing session
    const getInitialSession = async () => {
      try {
        // Important: Only check for session AFTER listener is established
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        console.log(`[AUTH] Initial session fetch complete: ${data.session ? 'Session found' : 'No session'}`);
        
        if (mounted) {
          setState({
            session: data.session,
            user: data.session?.user ?? null,
            loading: false,
            error: null,
            isReady: true,
          });
        }
      } catch (error) {
        console.error('[AUTH] Error getting initial session:', error);
        if (mounted) {
          setState({
            session: null,
            user: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to get initial session'),
            isReady: true,
          });
        }
      }
    };

    // Execute in the correct sequence
    const initializeAuth = async () => {
      // First establish the listener
      await setupAuthListener();
      // Then check for existing session
      await getInitialSession();
    };

    initializeAuth();

    // Clean up
    return () => {
      mounted = false;
      if (authListener) {
        console.log('[AUTH] Cleaning up auth listener');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return state;
}
