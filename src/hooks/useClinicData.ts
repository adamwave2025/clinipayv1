import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  NotificationService,
  NotificationSettings, 
} from '@/services/NotificationService';
import type { NotificationPreference } from '@/types/notification';
import { ClinicDataService, ClinicData } from '@/services/ClinicDataService';
import { LogoService } from '@/services/LogoService';

export type { ClinicData } from '@/services/ClinicDataService';

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
      const clinicData = await ClinicDataService.fetchClinicDataByUserId(user.id);
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
      const result = await ClinicDataService.updateClinicData(clinicData.id, updatedData);
      
      if (result.success) {
        setClinicData({
          ...clinicData,
          ...updatedData,
        });
      }

      return result;
    } catch (error: any) {
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
      const result = await LogoService.uploadLogo(user.id, clinicData.id, file);
      
      if (result.success && result.url) {
        setClinicData({
          ...clinicData,
          logo_url: result.url
        });
      }
      
      return result;
    } catch (error: any) {
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
      const result = await LogoService.deleteLogo(clinicData.id, clinicData.logo_url);
      
      if (result.success) {
        setClinicData({
          ...clinicData,
          logo_url: null
        });
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
    }
  };

  const updateNotificationSetting = async (setting: string, checked: boolean) => {
    if (!clinicData) return false;

    const mappedPreference = NotificationService.mapSettingToPreference(setting);
    
    if (!mappedPreference) {
      console.error('Invalid notification setting:', setting);
      return false;
    }

    const { channel, type } = mappedPreference;

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
