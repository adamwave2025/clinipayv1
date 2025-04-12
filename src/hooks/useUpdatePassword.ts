
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUpdatePassword() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // First verify the current password is correct by attempting a sign-in with it
      // Note: We don't actually complete the sign-in, just verify credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: supabase.auth.getUser().then(({ data }) => data.user?.email || ''),
        password: currentPassword,
      });

      // If the current password verification failed
      if (signInError) {
        setError('Current password is incorrect');
        toast.error('Current password is incorrect');
        return false;
      }
      
      // Now update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        setError(updateError.message);
        toast.error(`Failed to update password: ${updateError.message}`);
        return false;
      }
      
      toast.success('Password updated successfully');
      return true;
      
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`Error updating password: ${errorMessage}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePassword, isUpdating, error };
}
