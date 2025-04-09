
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationPreference {
  id: string;
  clinic_id: string;
  channel: 'email' | 'sms';
  type: 'payments' | 'refunds' | 'summary';
  enabled: boolean;
}

// Mapping between UI state and database records
export interface NotificationSettings {
  emailPayments: boolean;
  emailRefunds: boolean;
  emailSummary: boolean;
  smsPayments: boolean;
  smsRefunds: boolean;
}

export const NotificationService = {
  // Convert database records to UI state
  mapPreferencesToSettings(preferences: NotificationPreference[]): NotificationSettings {
    const defaultSettings: NotificationSettings = {
      emailPayments: false,
      emailRefunds: false,
      emailSummary: false,
      smsPayments: false,
      smsRefunds: false
    };

    if (!preferences || preferences.length === 0) {
      return defaultSettings;
    }

    return preferences.reduce((settings, pref) => {
      // Map database record to UI settings key
      const key = `${pref.channel}${pref.type.charAt(0).toUpperCase() + pref.type.slice(1)}` as keyof NotificationSettings;
      return { ...settings, [key]: pref.enabled };
    }, defaultSettings);
  },

  // Fetch notification preferences for a clinic
  async fetchNotificationPreferences(clinicId: string): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) {
        throw error;
      }

      return data as NotificationPreference[];
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
      return [];
    }
  },

  // Update a specific notification preference
  async updateNotificationPreference(
    clinicId: string, 
    channel: 'email' | 'sms', 
    type: 'payments' | 'refunds' | 'summary', 
    enabled: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ enabled })
        .eq('clinic_id', clinicId)
        .eq('channel', channel)
        .eq('type', type);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      toast.error('Failed to update notification preference');
      return false;
    }
  },

  // Update all notification preferences at once
  async updateAllNotificationPreferences(
    clinicId: string,
    settings: NotificationSettings
  ): Promise<boolean> {
    try {
      // Create an array of update operations
      const updates = [
        { channel: 'email', type: 'payments', enabled: settings.emailPayments },
        { channel: 'email', type: 'refunds', enabled: settings.emailRefunds },
        { channel: 'email', type: 'summary', enabled: settings.emailSummary },
        { channel: 'sms', type: 'payments', enabled: settings.smsPayments },
        { channel: 'sms', type: 'refunds', enabled: settings.smsRefunds }
      ];

      // Perform all updates in parallel
      const results = await Promise.all(
        updates.map(({ channel, type, enabled }) => 
          this.updateNotificationPreference(clinicId, channel as 'email' | 'sms', type as 'payments' | 'refunds' | 'summary', enabled)
        )
      );

      // Check if all updates were successful
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error updating all notification preferences:', error);
      toast.error('Failed to update notification preferences');
      return false;
    }
  }
};
