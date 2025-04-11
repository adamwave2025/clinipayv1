
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerifyResetTokenResult {
  isValid: boolean;
  userId?: string;
  error?: string;
}

interface RequestPasswordResetResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Request a password reset link for a given email
 */
export const requestPasswordReset = async (email: string): Promise<RequestPasswordResetResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('reset-password', {
      method: 'POST',
      body: { email }
    });
    
    if (error) {
      console.error('Error requesting password reset:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send reset instructions' 
      };
    }
    
    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Failed to send reset instructions' 
      };
    }
    
    return { 
      success: true, 
      message: data.message || 'Password reset link sent successfully' 
    };
  } catch (error: any) {
    console.error('Unexpected error requesting password reset:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Verify a reset token is valid
 */
export const verifyResetToken = async (token: string, userId: string): Promise<VerifyResetTokenResult> => {
  try {
    // Verify the token against our database
    const { data, error } = await supabase
      .from('users')
      .select('verification_token, token_expires_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error verifying token:', error);
      return { 
        isValid: false, 
        error: 'Error verifying reset token' 
      };
    }
    
    if (!data) {
      return { 
        isValid: false, 
        error: 'Invalid user ID' 
      };
    }
    
    if (data.verification_token !== token) {
      return { 
        isValid: false, 
        error: 'Invalid reset token' 
      };
    }
    
    if (!data.token_expires_at || new Date(data.token_expires_at) < new Date()) {
      return { 
        isValid: false, 
        error: 'This reset link has expired' 
      };
    }
    
    return { 
      isValid: true, 
      userId 
    };
  } catch (error: any) {
    console.error('Error verifying reset token:', error);
    return { 
      isValid: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

/**
 * Reset a user's password with the provided token
 */
export const resetPassword = async (
  password: string, 
  userId: string, 
  token: string
): Promise<ResetPasswordResult> => {
  try {
    // First verify the token is valid
    const tokenVerification = await verifyResetToken(token, userId);
    
    if (!tokenVerification.isValid) {
      return { 
        success: false, 
        error: tokenVerification.error || 'Invalid or expired reset token' 
      };
    }
    
    // Update the user password in auth.users (through auth API)
    const { error: authError } = await supabase.auth.updateUser({
      password,
    });
    
    if (authError) {
      console.error('Error updating password:', authError);
      return { 
        success: false, 
        error: authError.message || 'Failed to update password' 
      };
    }
    
    // Clear the verification token from our users table
    const { error: clearTokenError } = await supabase
      .from('users')
      .update({ 
        verification_token: null,
        token_expires_at: null
      })
      .eq('id', userId);
    
    if (clearTokenError) {
      console.error('Error clearing reset token:', clearTokenError);
      // Non-critical error, continue with success flow
    }
    
    return { 
      success: true, 
      message: 'Password updated successfully' 
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};
