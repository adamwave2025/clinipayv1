
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
    
    // Call the update-user-password edge function to update the password
    const { data, error } = await supabase.functions.invoke('update-user-password', {
      method: 'POST',
      body: { userId, token, password }
    });
    
    if (error) {
      console.error('Error updating password via edge function:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      };
    }
    
    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Failed to update password' 
      };
    }
    
    return { 
      success: true, 
      message: data.message || 'Password updated successfully' 
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};
