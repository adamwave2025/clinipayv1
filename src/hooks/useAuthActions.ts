
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { setupUserVerification, checkUserVerification } from '@/utils/auth-utils';

/**
 * Hook to manage auth actions like signIn, signUp, and signOut
 */
export function useAuthActions() {
  const navigate = useNavigate();

  const signUp = async (email: string, password: string, clinicName: string) => {
    try {
      console.log('Starting sign up process...', { email, clinicName });
      
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
        console.error('Supabase Auth signup error:', error);
        toast.error(error.message);
        return { error };
      }
      
      // If signup was successful
      if (data?.user) {
        try {
          console.log('User created successfully, setting up verification...', data.user.id);
          
          // Store userId in localStorage for verification page
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('verificationEmail', email);
          
          // Set up verification for the new user
          console.log('Calling setupUserVerification with:', {
            userId: data.user.id,
            email,
            clinicName
          });
          
          const verification = await setupUserVerification(
            data.user.id, 
            email, 
            clinicName
          );

          console.log('Verification setup response:', verification);

          if (!verification.success) {
            console.error("Error setting up verification:", verification.error);
            
            // Detailed error categorization for better debugging
            if (verification.error) {
              if (verification.error.includes('Database error') || 
                  verification.error.includes('constraint violation')) {
                console.error('Database constraint violation detected during user verification setup');
                console.error('Verification error details:', verification);
                toast.error("There was an issue with your account setup. Please try again with a different email.");
              } else if (verification.error.includes('already exists')) {
                toast.error("An account with this email already exists. Please sign in instead.");
              } else {
                toast.error("There was an issue setting up your account. Please try again.");
              }
            } else {
              toast.error("There was an issue setting up your account. Please try again.");
            }
            
            // Sign out the user after signup failure
            await supabase.auth.signOut();
            return { error: new Error(verification.error || "Unknown error during verification setup") };
          }
          
          console.log('Verification setup successful');
          
          // Sign out the user after signup to force verification
          await supabase.auth.signOut();
          
          toast.success("Sign up successful! Please check your email for verification.");
          navigate('/verify-email?email=' + encodeURIComponent(email));
          return { error: null };
        } catch (functionError: any) {
          console.error("Failed during signup process:", functionError);
          console.error("Error stack:", functionError.stack);
          
          // Additional error context
          console.error("Context:", {
            userId: data.user.id,
            email,
            clinicName,
            errorType: functionError.name,
            errorMessage: functionError.message
          });
          
          // Sign out the user if there was an error
          await supabase.auth.signOut();
          
          toast.error("There was an issue setting up your account. Please try again.");
          return { error: functionError };
        }
      }
      
      return { error: new Error("Failed to complete signup process") };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      console.error('Error stack:', error.stack);
      toast.error('An unexpected error occurred during sign up');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      // First check if the user is already verified in our system
      // by trying to find them by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, verified, clinic_id, role')
        .eq('email', email)
        .maybeSingle();
      
      console.log('User verification check:', userData, userError);
      
      if (userError) {
        console.error('Error checking user verification status:', userError);
      } else if (userData && !userData.verified) {
        // If we know the user exists but is not verified, prevent signin
        toast.error('Please verify your email address before signing in');
        localStorage.setItem('verificationEmail', email);
        localStorage.setItem('userId', userData.id);
        navigate('/verify-email');
        return { error: new Error('Email not verified') };
      }
      
      // Proceed with sign in attempt
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
      console.log('Checking verification status for user ID:', data.user.id);
      const verificationCheck = await checkUserVerification(data.user.id);
      
      console.log('Verification check result:', verificationCheck);
      
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
      
      // Get the user's role from our database
      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (roleError) {
        console.error('Error fetching user role:', roleError);
      }
      
      // Show success message
      toast.success('Signed in successfully');
      
      // Redirect based on role
      const role = roleData?.role || 'clinic'; // Default to clinic if no role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
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
      navigate('/sign-in');
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('An error occurred during sign out');
    }
  };

  return { signIn, signUp, signOut };
}
