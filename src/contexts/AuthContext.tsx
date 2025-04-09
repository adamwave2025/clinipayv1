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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Helper function to create user records directly
  const createUserRecords = async (userId: string, email: string, clinicName: string) => {
    console.log('Creating user records directly for:', userId);
    
    try {
      // 1. Create clinic record
      const { error: clinicError } = await supabase
        .from('clinics')
        .upsert({
          id: userId,
          clinic_name: clinicName,
          email: email,
          created_at: new Date().toISOString()
        });
      
      if (clinicError) {
        console.error('Error creating clinic record:', clinicError);
        throw clinicError;
      }
      
      // 2. Create user record with clinic role
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          role: 'clinic',
          clinic_id: userId,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (userError) {
        console.error('Error creating user record:', userError);
        throw userError;
      }
      
      // 3. Create verification record - using raw query to avoid type error
      // Since user_verification table might not be in the TypeScript types yet
      const verificationToken = crypto.randomUUID();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1); // 24 hours from now
      
      // Use rpc to execute a raw SQL query instead of direct table access
      const { error: verificationError } = await supabase.rpc('insert_verification', {
        p_user_id: userId,
        p_email: email,
        p_token: verificationToken,
        p_expires_at: expiryDate.toISOString()
      });
      
      if (verificationError) {
        console.error('Error creating verification record:', verificationError);
        throw verificationError;
      }
      
      // Return verification information
      return { 
        success: true,
        verificationToken,
        verificationUrl: `https://clinipay.co.uk/verify-email?token=${verificationToken}&userId=${userId}`
      };
    } catch (error) {
      console.error('Error in createUserRecords:', error);
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, clinicName: string) => {
    try {
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
          
          console.log("Calling handle-new-signup function for user:", data.user.id);
          
          // First try to use the edge function for verification
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
            
            // If edge function fails, fall back to direct record creation
            console.log("Falling back to direct record creation");
            const directResult = await createUserRecords(data.user.id, email, clinicName);
            
            if (directResult.success) {
              console.log("Direct record creation successful");
              toast.success("Sign up successful! Please check your email for verification.");
              navigate('/verify-email?email=' + encodeURIComponent(email));
              return { error: null };
            } else {
              console.error("Direct record creation failed:", directResult.error);
              toast.error("There was an issue setting up your account. Please try again.");
            }
          } else {
            console.log("handle-new-signup function called successfully:", response.data);
            toast.success("Sign up successful! Please check your email for verification.");
            navigate('/verify-email?email=' + encodeURIComponent(email));
            return { error: null };
          }
        } catch (functionError) {
          console.error("Failed to call handle-new-signup function:", functionError);
          
          // Fall back to direct record creation
          console.log("Falling back to direct record creation due to exception");
          const directResult = await createUserRecords(data.user.id, email, clinicName);
          
          if (directResult.success) {
            console.log("Direct record creation successful after exception");
            toast.success("Sign up successful! Please check your email for verification.");
            navigate('/verify-email?email=' + encodeURIComponent(email));
            return { error: null };
          } else {
            console.error("Direct record creation failed after exception:", directResult.error);
            toast.error("There was an issue setting up your account. Please try again.");
          }
        }
      }
      
      return { error: new Error("Failed to complete signup process") };
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
      } catch (verificationError) {
        console.error('Error checking verification status:', verificationError);
        // Sign them out if there's any error in verification
        await supabase.auth.signOut();
        toast.error('Error verifying account status. Please try again.');
        return { error: verificationError };
      }
      
      toast.success('Signed in successfully');
      return { error: null };
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
