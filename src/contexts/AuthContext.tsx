
import React, { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useUnifiedAuth } from './UnifiedAuthContext';

// Keep the existing interface for backward compatibility
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, clinicName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any, needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  authTriggerStatus: {
    isSetupComplete: boolean;
    setupError: string | null;
    retries: number;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider now uses the UnifiedAuthProvider internally but exposes the same API
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get our new auth implementation
  const { 
    session, 
    user, 
    isLoading: loading, 
    signUp: newSignUp,
    signIn: newSignIn,
    signOut,
    error
  } = useUnifiedAuth();
  
  // Adapt new signUp to match old interface
  const signUp = async (email: string, password: string, clinicName: string) => {
    try {
      const result = await newSignUp(email, password, clinicName);
      return { error: result.error };
    } catch (err) {
      return { error: err };
    }
  };
  
  // Adapt new signIn to match old interface
  const signIn = async (email: string, password: string) => {
    try {
      const result = await newSignIn(email, password);
      return { 
        error: result.error,
        needsVerification: result.needsVerification
      };
    } catch (err) {
      return { error: err };
    }
  };
  
  // Mock the auth trigger status - a placeholder to avoid breaking changes
  // This would need proper reimplementation if it's actually used
  const authTriggerStatus = {
    isSetupComplete: true,
    setupError: null,
    retries: 0
  };

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
