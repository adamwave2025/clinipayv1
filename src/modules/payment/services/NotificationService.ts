
// Notification service for handling email and SMS notification status

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationSettings {
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

export class NotificationService {
  /**
   * Update notification settings for a clinic
   * @param settings Email and SMS notification preferences
   * @returns Success status and message
   */
  static async updateSettings(settings: NotificationSettings): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from('clinics')
        .update(settings)
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      return {
        success: true,
        message: 'Notification settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return {
        success: false,
        message: 'Failed to update notification settings'
      };
    }
  }

  /**
   * Get notification settings for the current clinic
   * @returns Current notification settings
   */
  static async getSettings(): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase.from('clinics')
        .select('email_notifications, sms_notifications')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  /**
   * Send a test notification
   * @param type The type of notification to send (email or sms)
   * @returns Success status and message
   */
  static async sendTestNotification(type: 'email' | 'sms'): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate sending a test notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Test ${type} sent successfully`);
      
      return {
        success: true,
        message: `Test ${type} notification sent`
      };
    } catch (error) {
      console.error(`Error sending test ${type} notification:`, error);
      return {
        success: false,
        message: `Failed to send test ${type} notification`
      };
    }
  }
}
