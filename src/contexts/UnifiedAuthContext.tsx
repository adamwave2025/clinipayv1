
import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession, AuthSessionState } from '@/hooks/useAuthSession';
import { useUserData, UserDataState } from '@/hooks/useUserData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignInResult {
  error: Error | null;
  needsVerification?: boolean;
}

interface SignUpResult {
  error: Error | null;
  verificationSent?: boolean;
}

interface AuthContextValue extends AuthSessionState, UserDataState {
  // Unified loading and ready state
  isLoading: boolean;
  isAuthenticated: boolean;
  isFullyLoaded: boolean;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, clinicName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  
  // Debug helpers
  debugState: {
    sessionLoading: boolean;
    userDataLoading: boolean;
    sessionReady: boolean;
    userDataReady: boolean;
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get session state
  const sessionState = useAuthSession();
  
  // Get user data that depends on session
  const userData = useUserData(sessionState.user);
  
  // Unified auth state
  const isLoading = sessionState.loading || userData.loading;
  const isFullyLoaded = sessionState.isReady && userData.isReady;
  const isAuthenticated = Boolean(sessionState.session && sessionState.user);
  
  // Auth actions
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      console.log('[AUTH] Signing in:', email);

      // First check if the user is verified in our custom system
      // by trying to find them by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, verified, clinic_id, role')
        .eq('email', email)
        .maybeSingle();
      
      console.log('[AUTH] User verification check:', userData, userError);
      
      // If user exists but is not verified, prevent sign in
      if (userData && !userData.verified) {
        console.log('[AUTH] User not verified, preventing sign in');
        localStorage.setItem('verificationEmail', email);
        localStorage.setItem('userId', userData.id);
        return { 
          error: new Error('Email not verified'), 
          needsVerification: true 
        };
      }
      
      // Proceed with sign in attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle email verification error from Supabase Auth
        if (error.message.includes('Email not confirmed')) {
          console.log('[AUTH] Email not confirmed in Supabase Auth');
          localStorage.setItem('verificationEmail', email);
          return { 
            error: error, 
            needsVerification: true 
          };
        }
        throw error;
      }
      
      // Double-check verification in our custom system
      if (data.user) {
        const verificationCheck = await checkUserVerification(data.user.id);
        
        if (!verificationCheck.verified) {
          // User is not verified in our custom system
          await supabase.auth.signOut(); // Sign them out
          console.log('[AUTH] User not verified in our system');
          localStorage.setItem('verificationEmail', email);
          localStorage.setItem('userId', data.user.id);
          return { 
            error: new Error('Email not verified'), 
            needsVerification: true 
          };
        }
      }
      
      console.log('[AUTH] Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('[AUTH] Sign in error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Sign in failed') 
      };
    }
  };
  
  const signUp = async (
    email: string, 
    password: string, 
    clinicName: string
  ): Promise<SignUpResult> => {
    try {
      console.log('[AUTH] Signing up:', email);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            clinic_name: clinicName,
          },
        },
      });
      
      if (error) throw error;
      
      console.log('[AUTH] Sign up successful, verification may be required');
      
      if (data.user) {
        // Store userId and email for verification page
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('verificationEmail', email);
        
        console.log('[AUTH] Calling handle-new-signup for user:', data.user.id);
        
        // Call edge function to handle verification setup
        const { error: webhookError } = await supabase.functions.invoke('handle-new-signup', {
          method: 'POST',
          body: { 
            id: data.user.id,
            email: email,
            clinic_name: clinicName
          }
        });
        
        if (webhookError) {
          console.error('[AUTH] Error calling handle-new-signup:', webhookError);
          throw webhookError;
        }
        
        // Sign out to force verification flow
        await supabase.auth.signOut();
      }
      
      return { 
        error: null,
        verificationSent: true
      };
    } catch (error) {
      console.error('[AUTH] Sign up error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Sign up failed')
      };
    }
  };
  
  const signOut = async (): Promise<void> => {
    try {
      console.log('[AUTH] Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[AUTH] Sign out successful');
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
      throw error instanceof Error ? error : new Error('Sign out failed');
    }
  };

  // Helper function to check user verification
  const checkUserVerification = async (userId: string) => {
    try {
      console.log('[AUTH] Checking verification status for:', userId);
      
      const { data, error } = await supabase.functions.invoke('handle-new-signup', {
        method: 'POST',
        body: { 
          userId, 
          type: 'check_verification'
        }
      });
      
      if (error) {
        console.error('[AUTH] Error checking verification:', error);
        return { verified: false, error: error.message };
      }
      
      console.log('[AUTH] Verification check result:', data);
      
      return { 
        verified: !!data?.verified,
        error: data?.error 
      };
    } catch (error: any) {
      console.error('[AUTH] Error in checkUserVerification:', error);
      return { 
        verified: false, 
        error: error.message || 'An unexpected error occurred' 
      };
    }
  };
  
  // Debug state
  const debugState = {
    sessionLoading: sessionState.loading,
    userDataLoading: userData.loading,
    sessionReady: sessionState.isReady,
    userDataReady: userData.isReady
  };
  
  // Combine all values
  const value: AuthContextValue = {
    // Session state
    session: sessionState.session,
    user: sessionState.user,
    loading: sessionState.loading,
    error: sessionState.error || userData.error,
    isReady: sessionState.isReady,
    
    // User data
    role: userData.role,
    clinicId: userData.clinicId,
    
    // Unified state
    isLoading,
    isAuthenticated,
    isFullyLoaded,
    
    // Actions
    signIn,
    signUp,
    signOut,
    
    // Debug
    debugState
  };
  
  console.log('[AUTH CONTEXT] Rendering with state:', {
    isLoading,
    isAuthenticated,
    isFullyLoaded,
    role: userData.role,
    clinicId: userData.clinicId,
    session: sessionState.session ? 'exists' : 'null'
  });
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useUnifiedAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an UnifiedAuthProvider');
  }
  
  return context;
};

// Re-export for convenience
export type { AuthContextValue };
