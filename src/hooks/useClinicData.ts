import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationService, NotificationSettings, NotificationPreference } from '@/services/NotificationService';

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
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailPaymentReceived: false,
    emailRefundProcessed: false,
    emailWeeklySummary: false,
    smsPaymentReceived: false,
    smsRefundProcessed: false
  });
  const { user } = useAuth();

  const fetchClinicData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        throw new Error('Failed to fetch clinic data: ' + clinicError.message);
      }

      setClinicData(clinicData);

      const preferences = await NotificationService.fetchNotificationPreferences(clinicData.id);
      setNotificationPreferences(preferences);
      
      const settings = NotificationService.mapPreferencesToSettings(preferences);
      setNotificationSettings(settings);
      
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
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('cliniclogo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cliniclogo')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', clinicData.id);

      if (updateError) throw updateError;

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
      const fileUrl = new URL(clinicData.logo_url);
      const pathWithBucket = fileUrl.pathname.split('/');
      const bucketIndex = pathWithBucket.findIndex(part => part === 'cliniclogo');
      
      if (bucketIndex === -1) {
        throw new Error('Invalid logo URL format');
      }
      
      const filePath = pathWithBucket.slice(bucketIndex + 1).join('/');
      
      const { error: deleteError } = await supabase.storage
        .from('cliniclogo')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: null })
        .eq('id', clinicData.id);

      if (updateError) throw updateError;

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

  const updateNotificationSetting = async (setting: string, checked: boolean) => {
    if (!clinicData) return false;

    let channel: 'email' | 'sms';
    let type: 'payment_received' | 'refund_processed' | 'weekly_summary';

    if (setting.startsWith('email')) {
      channel = 'email';
      if (setting === 'emailPaymentReceived') type = 'payment_received';
      else if (setting === 'emailRefundProcessed') type = 'refund_processed';
      else if (setting === 'emailWeeklySummary') type = 'weekly_summary';
      else {
        console.error('Invalid notification setting:', setting);
        return false;
      }
    } else if (setting.startsWith('sms')) {
      channel = 'sms';
      if (setting === 'smsPaymentReceived') type = 'payment_received';
      else if (setting === 'smsRefundProcessed') type = 'refund_processed';
      else {
        console.error('Invalid notification setting:', setting);
        return false;
      }
    } else {
      console.error('Invalid notification setting:', setting);
      return false;
    }

    setNotificationSettings(prev => ({
      ...prev,
      [setting]: checked
    }));

    try {
      const success = await NotificationService.updateNotificationPreference(
        clinicData.id,
        channel,
        type,
        checked
      );

      return success;
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return false;
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
    notificationSettings,
    fetchClinicData,
    updateClinicData,
    uploadLogo,
    deleteLogo,
    updateNotificationSetting
  };
}
