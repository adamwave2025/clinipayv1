
import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession, AuthSessionState } from '@/hooks/useAuthSession';
import { useUserData, UserDataState } from '@/hooks/useUserData';
import { supabase } from '@/integrations/supabase/client';

interface SignInResult {
  error: Error | null;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
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
