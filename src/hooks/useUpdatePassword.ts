
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
      // First get the current user's email - we need to await this properly
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      
      if (!userEmail) {
        setError('Could not retrieve user email. Please sign in again.');
        toast.error('Authentication error. Please sign in again.');
        return false;
      }
      
      // Verify the current password is correct by attempting a sign-in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
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
