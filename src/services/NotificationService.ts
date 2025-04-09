
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationPreference, NotificationSettings } from '@/types/notification';
import { NotificationMapperService } from './NotificationMapperService';

export type { NotificationPreference, NotificationSettings } from '@/types/notification';

/**
 * Service for handling notification preferences
 */
export const NotificationService = {
  ...NotificationMapperService,
  
  /**
   * Fetch notification preferences for a clinic
   */
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

  /**
   * Update a specific notification preference
   */
  async updateNotificationPreference(
    clinicId: string, 
    channel: 'email' | 'sms', 
    type: 'payment_received' | 'refund_processed' | 'weekly_summary', 
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

  /**
   * Update all notification preferences at once
   */
  async updateAllNotificationPreferences(
    clinicId: string,
    settings: NotificationSettings
  ): Promise<boolean> {
    try {
      // Create an array of update operations
      const updates = [
        { channel: 'email', type: 'payment_received', enabled: settings.emailPaymentReceived },
        { channel: 'email', type: 'refund_processed', enabled: settings.emailRefundProcessed },
        { channel: 'email', type: 'weekly_summary', enabled: settings.emailWeeklySummary },
        { channel: 'sms', type: 'payment_received', enabled: settings.smsPaymentReceived },
        { channel: 'sms', type: 'refund_processed', enabled: settings.smsRefundProcessed }
      ];

      // Perform all updates in parallel
      const results = await Promise.all(
        updates.map(({ channel, type, enabled }) => 
          this.updateNotificationPreference(clinicId, channel as 'email' | 'sms', type as 'payment_received' | 'refund_processed' | 'weekly_summary', enabled)
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
