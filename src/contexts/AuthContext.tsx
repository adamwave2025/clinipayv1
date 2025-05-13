
import React, { createContext, useContext } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, loading } = useAuthState();
  const { signUp, signIn, signOut } = useAuthActions();
  
  // Setup auth trigger - this ensures our handle_new_user function is properly setup
  const authTriggerStatus = useAuthTrigger();
  
  // Show a warning toast if we hit max retries
  React.useEffect(() => {
    if (authTriggerStatus.retries > 0 && authTriggerStatus.setupError) {
      console.warn('Auth trigger setup issues detected:', authTriggerStatus.setupError);
    }
  }, [authTriggerStatus.retries, authTriggerStatus.setupError]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        authTriggerStatus,
      }}
    >
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
