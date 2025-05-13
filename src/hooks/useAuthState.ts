
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to manage authentication state
 */
export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear any stored verification data
          localStorage.removeItem('userId');
          localStorage.removeItem('verificationEmail');
          
          // Only redirect if not already on a public page
          const publicPaths = ['/sign-in', '/sign-up', '/verify-email', '/'];
          if (!publicPaths.some(path => location.pathname.startsWith(path))) {
            navigate('/sign-in');
          }
        } else if (event === 'SIGNED_IN') {
          // Don't immediately redirect to dashboard on sign-in
          // This will be handled by the sign-in function after verifying email
          console.log('User signed in, verification will be checked in signIn function');
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { session, user, loading };
}
