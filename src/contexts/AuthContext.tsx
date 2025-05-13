
import React, { createContext, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useAuthTrigger } from '@/hooks/useAuthTrigger';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, clinicName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  authTriggerStatus: {
    isSetupComplete: boolean;
    setupError: string | null;
    retries: number;
  };
  debugMode?: boolean;
}

// Create a context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Debug setting - can be toggled via localStorage for testing
const DEBUG_AUTH = localStorage.getItem('DEBUG_AUTH') === 'true' || false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, loading } = useAuthState();
  const { signUp, signIn, signOut } = useAuthActions();
  
  // Setup auth trigger - this ensures our handle_new_user function is properly setup
  const authTriggerStatus = useAuthTrigger();
  
  // Enhanced debug logging for auth state changes
  useEffect(() => {
    if (DEBUG_AUTH) {
      console.group('📊 Auth State Debug');
      console.log('Auth Loading:', loading);
      console.log('User:', user ? `${user.id} (${user.email})` : 'null');
      console.log('Session Valid:', !!session);
      if (session) {
        const expiresAt = new Date(session.expires_at * 1000);
        const timeLeft = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);
        console.log(`Session expires in ~${timeLeft} minutes`);
      }
      console.groupEnd();
    }
  }, [session, user, loading]);
  
  // Show a warning toast if we hit max retries
  React.useEffect(() => {
    if (authTriggerStatus.retries > 0 && authTriggerStatus.setupError) {
      console.warn('Auth trigger setup issues detected:', authTriggerStatus.setupError);
      
      if (authTriggerStatus.retries > 3) {
        // Only show to users after multiple retries to avoid annoying them
        toast.error('Authentication service is experiencing issues. Some features may be limited.');
      }
    }
  }, [authTriggerStatus.retries, authTriggerStatus.setupError]);

  // Context value with debug flag
  const contextValue = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    authTriggerStatus,
    debugMode: DEBUG_AUTH
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
