
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

// Debug setting - can be enabled via localStorage
const DEBUG_AUTH = localStorage.getItem('DEBUG_AUTH') === 'true' || false;

/**
 * Hook to manage authentication state with improved resilience and debugging
 */
export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track auth state for debugging
  const authStateRef = useRef({
    lastEvent: '',
    lastPath: '',
    hasSession: false,
    timestamp: Date.now(),
    sessionChecked: false
  });

  // Track network state to handle connectivity issues
  const networkStateRef = useRef({
    isOnline: navigator.onLine,
    reconnectAttempts: 0,
    lastReconnectTime: 0
  });

  // Debug logging function for auth events
  const logAuthEvent = (event: string, details?: any) => {
    if (DEBUG_AUTH) {
      console.group(`🔐 Auth Event: ${event}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Path: ${location.pathname}`);
      console.log(`Network: ${navigator.onLine ? 'Online' : 'Offline'}`);
      if (details) console.log('Details:', details);
      console.groupEnd();
    }
  };

  // Network state listener
  useEffect(() => {
    const handleNetworkChange = () => {
      const isNowOnline = navigator.onLine;
      const wasOnline = networkStateRef.current.isOnline;
      
      if (isNowOnline !== wasOnline) {
        networkStateRef.current.isOnline = isNowOnline;
        
        if (isNowOnline && !wasOnline) {
          // We're coming back online - refresh session
          logAuthEvent('Network reconnected', { attemptingSessionRefresh: true });
          
          // Only attempt refresh if we've been offline for a while
          const now = Date.now();
          if (now - networkStateRef.current.lastReconnectTime > 10000) {
            networkStateRef.current.lastReconnectTime = now;
            networkStateRef.current.reconnectAttempts += 1;
            
            // Refresh session but don't block UI
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                logAuthEvent('Session refreshed after reconnect', { user: data.session.user.id });
              }
            }).catch(error => {
              logAuthEvent('Error refreshing session', { error });
            });
          }
        }
      }
    };
    
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    // Track path changes for debugging auth redirects
    if (authStateRef.current.lastPath !== location.pathname) {
      logAuthEvent('Path changed', { 
        from: authStateRef.current.lastPath, 
        to: location.pathname,
        hasSession: !!session
      });
      authStateRef.current.lastPath = location.pathname;
    }
  }, [location.pathname, session]);

  useEffect(() => {
    // Set up the auth state listener first to avoid missing events
    logAuthEvent('Setting up auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        logAuthEvent('Auth state changed', { event, hasSession: !!newSession });
        authStateRef.current.lastEvent = event;
        authStateRef.current.timestamp = Date.now();
        authStateRef.current.hasSession = !!newSession;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear any stored verification data
          localStorage.removeItem('userId');
          localStorage.removeItem('verificationEmail');
          
          // Cache clearing for user role
          try {
            localStorage.removeItem('user_role_cache');
            localStorage.removeItem('user_role_cache_user');
            localStorage.removeItem('user_role_cache_expiry');
            logAuthEvent('Cleared role cache on signout');
          } catch (e) {
            console.warn('Error clearing role cache:', e);
          }
          
          // Only redirect if not already on a public page
          const publicPaths = ['/sign-in', '/sign-up', '/verify-email', '/'];
          if (!publicPaths.some(path => location.pathname.startsWith(path))) {
            logAuthEvent('Redirecting to sign-in after signout', { from: location.pathname });
            navigate('/sign-in');
          }
        } else if (event === 'SIGNED_IN') {
          // Don't immediately redirect to dashboard on sign-in
          // This will be handled by the sign-in function after verifying email
          logAuthEvent('User signed in, verification will be checked in signIn function');
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        logAuthEvent('Initializing auth - checking for existing session');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logAuthEvent('Error getting session', { error });
        } else {
          logAuthEvent('Session check complete', { hasSession: !!currentSession });
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          authStateRef.current.hasSession = !!currentSession;
          authStateRef.current.sessionChecked = true;
        }
      } catch (error) {
        logAuthEvent('Error getting session', { error });
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      logAuthEvent('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { session, user, loading };
}
