
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setupUserVerification, checkUserVerification } from '@/utils/auth-utils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, clinicName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          navigate('/sign-in');
        } else if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Setup auth trigger on initialization
    setupAuthTrigger();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Set up the auth trigger to handle webhooks
  const setupAuthTrigger = async () => {
    try {
      const { error } = await supabase.functions.invoke('setup-auth-trigger');
      if (error) {
        console.error('Error setting up auth trigger:', error);
      } else {
        console.log('Auth trigger setup complete');
      }
    } catch (error) {
      console.error('Failed to set up auth trigger:', error);
    }
  };

  const signUp = async (email: string, password: string, clinicName: string) => {
    try {
      // First sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            clinic_name: clinicName
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      // If signup was successful
      if (data?.user) {
        try {
          // Store userId in localStorage for verification page
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('verificationEmail', email);
          
          // Set up verification for the new user
          const verification = await setupUserVerification(
            data.user.id, 
            email, 
            clinicName
          );

          if (!verification.success) {
            console.error("Error setting up verification:", verification.error);
            toast.error("There was an issue setting up your account. Please try again.");
            return { error: new Error(verification.error) };
          }
          
          toast.success("Sign up successful! Please check your email for verification.");
          navigate('/verify-email?email=' + encodeURIComponent(email));
          return { error: null };
        } catch (functionError: any) {
          console.error("Failed during signup process:", functionError);
          toast.error("There was an issue setting up your account. Please try again.");
          return { error: functionError };
        }
      }
      
      return { error: new Error("Failed to complete signup process") };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      toast.error('An unexpected error occurred during sign up');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check if this is an email verification error
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email address before signing in');
          // Store email for the verification page
          localStorage.setItem('verificationEmail', email);
          navigate('/verify-email');
        } else {
          toast.error(error.message);
        }
        return { error };
      }
      
      // Check if the user is verified in our custom system
      const verificationCheck = await checkUserVerification(data.user.id);
      
      if (verificationCheck.error) {
        console.error('Error checking verification status:', verificationCheck.error);
        // If there's an error checking verification, sign them out to be safe
        await supabase.auth.signOut();
        toast.error('Error verifying account status. Please try again.');
        return { error: new Error('Error checking verification status') };
      } 
      
      if (!verificationCheck.verified) {
        // User is not verified in our custom system
        await supabase.auth.signOut(); // Sign them out
        toast.error('Please verify your email address before signing in');
        localStorage.setItem('verificationEmail', email);
        localStorage.setItem('userId', data.user.id);
        navigate('/verify-email');
        return { error: new Error('Email not verified') };
      }
      
      toast.success('Signed in successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Error during sign in:', error);
      toast.error('An unexpected error occurred during sign in');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('An error occurred during sign out');
    }
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
