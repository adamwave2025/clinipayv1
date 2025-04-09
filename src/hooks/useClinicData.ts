
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ClinicData = {
  id: string;
  clinic_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  logo_url: string | null;
};

export function useClinicData() {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const fetchClinicData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, get the user's clinic ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error('Failed to fetch user data: ' + userError.message);
      }

      if (!userData.clinic_id) {
        throw new Error('User is not associated with a clinic');
      }

      // Now fetch the clinic data using the clinic_id
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        throw new Error('Failed to fetch clinic data: ' + clinicError.message);
      }

      setClinicData(clinicData);
    } catch (error: any) {
      console.error('Error fetching clinic data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClinicData = async (updatedData: Partial<ClinicData>) => {
    if (!clinicData) {
      toast.error('No clinic data to update');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('clinics')
        .update(updatedData)
        .eq('id', clinicData.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setClinicData({
        ...clinicData,
        ...updatedData,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating clinic data:', error);
      toast.error('Failed to update clinic data: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const uploadLogo = async (file: File) => {
    if (!user || !clinicData) {
      toast.error('User or clinic data not available');
      return { success: false };
    }

    setIsUploading(true);

    try {
      // Create a unique file path with user ID as folder and timestamp for uniqueness
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload the file to the cliniclogo bucket
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

      // Update clinic record with the new logo URL
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', clinicData.id);

      if (updateError) throw updateError;

      // Update local state
      setClinicData({
        ...clinicData,
        logo_url: publicUrl
      });

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
    }
  };

  const deleteLogo = async () => {
    if (!user || !clinicData || !clinicData.logo_url) {
      toast.error('No logo to delete');
      return { success: false };
    }

    setIsUploading(true);

    try {
      // Extract the file path from the public URL
      const fileUrl = new URL(clinicData.logo_url);
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

      // Update clinic record to remove the logo URL
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: null })
        .eq('id', clinicData.id);

      if (updateError) throw updateError;

      // Update local state
      setClinicData({
        ...clinicData,
        logo_url: null
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, [user]);

  return {
    clinicData,
    isLoading,
    isUploading,
    error,
    fetchClinicData,
    updateClinicData,
    uploadLogo,
    deleteLogo
  };
}
