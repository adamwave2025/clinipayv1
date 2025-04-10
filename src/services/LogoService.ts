
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const LogoService = {
  async uploadLogo(userId: string, clinicId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload the file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('cliniclogo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('cliniclogo')
        .getPublicUrl(filePath);

      // Update the clinic record with the new logo URL
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', clinicId);

      if (updateError) {
        console.error('Error updating clinic logo URL:', updateError);
        throw updateError;
      }

      console.log('Logo URL updated successfully:', publicUrl);
      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
      return { success: false, error: error.message };
    }
  },

  async deleteLogo(clinicId: string, logoUrl: string) {
    try {
      const fileUrl = new URL(logoUrl);
      const pathWithBucket = fileUrl.pathname.split('/');
      const bucketIndex = pathWithBucket.findIndex(part => part === 'cliniclogo');
      
      if (bucketIndex === -1) {
        throw new Error('Invalid logo URL format');
      }
      
      const filePath = pathWithBucket.slice(bucketIndex + 1).join('/');
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('cliniclogo')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update the clinic record to remove the logo URL
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: null })
        .eq('id', clinicId);

      if (updateError) {
        console.error('Error updating clinic logo URL:', updateError);
        throw updateError;
      }

      console.log('Logo removed successfully from clinic record');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo: ' + error.message);
      return { success: false, error: error.message };
    }
  }
};
