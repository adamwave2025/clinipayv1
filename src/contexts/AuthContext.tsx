
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    console.log("Setting up auth state listener...");
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        // Update session state
        setSession(newSession);
        
        // If signed in, check verification status before setting user
        if (newSession?.user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('verified')
              .eq('id', newSession.user.id)
              .single();
            
            if (userError) {
              console.error('Error checking verification status:', userError);
              setUser(null);
              return;
            }
            
            // Only set the user if they are verified
            if (userData && userData.verified === true) {
              setUser(newSession.user);
              if (event === 'SIGNED_IN') {
                navigate('/dashboard');
              }
            } else {
              // If not verified, sign out
              console.log('User not verified, signing out');
              setUser(null);
              // Don't call signOut here as it would create an infinite loop
              // Just update the UI state
            }
          } catch (error) {
            console.error('Error checking user verification:', error);
            setUser(null);
          }
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            navigate('/sign-in');
          }
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Checking existing session:", currentSession ? "Found" : "None");
      
      if (currentSession?.user) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('verified')
            .eq('id', currentSession.user.id)
            .single();
          
          if (userError) {
            console.error('Error checking verification status:', userError);
            setUser(null);
            setSession(null);
            setLoading(false);
            return;
          }
          
          // Only set the user if they are verified
          if (userData && userData.verified === true) {
            setSession(currentSession);
            setUser(currentSession.user);
          } else {
            // If not verified, clear the session
            console.log('User not verified, clearing session');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            navigate('/verify-email');
          }
        } catch (error) {
          console.error('Error checking user verification:', error);
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, clinicName: string) => {
    try {
      console.log("Starting signup process for:", email);
      
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
        console.error("Signup error:", error.message);
        toast.error(error.message);
        return { error };
      }
      
      // If signup was successful, call our edge function to handle the new signup
      if (data?.user) {
        console.log("Signup successful, user created:", data.user.id);
        
        // Store userId and email in localStorage for verification page
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('verificationEmail', email);
        
        try {
          console.log("Calling handle-new-signup function for user:", data.user.id);
          
          // Send to the edge function directly with the needed data
          const response = await supabase.functions.invoke('handle-new-signup', {
            method: 'POST',
            body: {
              id: data.user.id,
              email: data.user.email,
              clinic_name: clinicName,
              raw_user_meta_data: data.user.user_metadata,
              type: 'direct_call'
            }
          });

          if (response.error) {
            console.error("Error calling handle-new-signup function:", response.error);
            toast.error("Sign up successful, but there was an issue setting up your account. Please contact support.");
          } else {
            console.log("handle-new-signup function called successfully:", response.data);
            toast.success("Sign up successful! Please check your email for verification.");
          }
        } catch (functionError) {
          console.error("Failed to call handle-new-signup function:", functionError);
          toast.error("Sign up successful, but there was an issue setting up your account. Please contact support.");
        }
      }
      
      // Sign out the user after sign up
      await supabase.auth.signOut();
      
      // Redirect to verification page
      navigate('/verify-email');
      return { error: null };
    } catch (error) {
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
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('verified')
          .eq('id', data.user.id)
          .single();
        
        if (userError) {
          console.error('Error checking verification status:', userError);
          // If there's an error checking verification, sign them out to be safe
          await supabase.auth.signOut();
          toast.error('Error verifying account status. Please try again.');
          return { error: new Error('Error checking verification status') };
        } 
        
        if (!userData || userData.verified !== true) {
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
      } catch (verificationError) {
        console.error('Error checking verification status:', verificationError);
        // Sign them out if there's any error in verification
        await supabase.auth.signOut();
        toast.error('Error verifying account status. Please try again.');
        return { error: verificationError };
      }
    } catch (error) {
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
