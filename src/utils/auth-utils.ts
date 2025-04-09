
/**
 * Authentication utilities for handling verification and auth-related operations
 */
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Send a verification email to the user
 */
export const sendVerificationEmail = async (email: string, userId?: string): Promise<{
  success: boolean;
  verificationUrl?: string;
  error?: string;
}> => {
  try {
    // Call the edge function for sending verification
    const { data, error } = await supabase.functions.invoke('handle-new-signup', {
      method: 'POST',
      body: { 
        email, 
        id: userId, 
        type: 'resend'
      }
    });
    
    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
    
    if (!data.success) {
      return { success: false, error: data.error || 'Failed to send verification email' };
    }
    
    return { 
      success: true, 
      verificationUrl: data.verificationUrl 
    };
  } catch (error: any) {
    console.error('Error in sendVerificationEmail:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Verify a user's email with the provided token
 */
export const verifyEmailToken = async (token: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Call the edge function to verify the token
    const { data, error } = await supabase.functions.invoke('handle-new-signup', {
      method: 'POST',
      body: { 
        token, 
        userId, 
        type: 'verify_token'
      }
    });
    
    if (error) {
      console.error('Error verifying token:', error);
      return { success: false, error: error.message };
    }
    
    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Invalid or expired verification token' 
      };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in verifyEmailToken:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Check if a user is verified in our custom system
 */
export const checkUserVerification = async (userId: string): Promise<{
  verified: boolean;
  error?: string;
}> => {
  try {
    // Query user table to check verification status
    const { data, error } = await supabase
      .from('users')
      .select('verified')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking verification status:', error);
      return { verified: false, error: error.message };
    }
    
    return { verified: !!data?.verified };
  } catch (error: any) {
    console.error('Error in checkUserVerification:', error);
    return { 
      verified: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Setup verification for a new user
 */
export const setupUserVerification = async (
  userId: string, 
  email: string, 
  clinicName: string
): Promise<{
  success: boolean;
  verificationUrl?: string;
  error?: string;
}> => {
  try {
    // Call the edge function to set up verification
    const response = await supabase.functions.invoke('handle-new-signup', {
      method: 'POST',
      body: {
        id: userId,
        email: email,
        clinic_name: clinicName,
        type: 'direct_call'
      }
    });

    if (response.error) {
      console.error("Error setting up user verification:", response.error);
      return { 
        success: false, 
        error: response.error.message || "There was an issue setting up verification"
      };
    } 
    
    return { 
      success: true, 
      verificationUrl: response.data?.verificationUrl
    };
  } catch (error: any) {
    console.error("Error in setupUserVerification:", error);
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    };
  }
};
