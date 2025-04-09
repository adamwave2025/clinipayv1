
import { NotificationPreference, NotificationSettings } from '@/types/notification';

/**
 * Service responsible for mapping between database records and UI state
 */
export const NotificationMapperService = {
  /**
   * Convert database records to UI state
   */
  mapPreferencesToSettings(preferences: NotificationPreference[]): NotificationSettings {
    const defaultSettings: NotificationSettings = {
      emailPaymentReceived: false,
      emailRefundProcessed: false,
      emailWeeklySummary: false,
      smsPaymentReceived: false,
      smsRefundProcessed: false
    };

    if (!preferences || preferences.length === 0) {
      return defaultSettings;
    }

    return preferences.reduce((settings, pref) => {
      // Create the settings key based on channel and type
      let key: keyof NotificationSettings;
      
      if (pref.channel === 'email') {
        if (pref.type === 'payment_received') key = 'emailPaymentReceived';
        else if (pref.type === 'refund_processed') key = 'emailRefundProcessed';
        else if (pref.type === 'weekly_summary') key = 'emailWeeklySummary';
        else return settings; // Skip if not a valid type
      } else if (pref.channel === 'sms') {
        if (pref.type === 'payment_received') key = 'smsPaymentReceived';
        else if (pref.type === 'refund_processed') key = 'smsRefundProcessed';
        else return settings; // Skip if not a valid type
      } else {
        return settings; // Skip if not a valid channel
      }
      
      return { ...settings, [key]: pref.enabled };
    }, defaultSettings);
  },

  /**
   * Maps a UI setting key to channel and type
   */
  mapSettingToPreference(setting: string): { channel: 'email' | 'sms', type: 'payment_received' | 'refund_processed' | 'weekly_summary' } | null {
    if (setting === 'emailPaymentReceived') {
      return { channel: 'email', type: 'payment_received' };
    } else if (setting === 'emailRefundProcessed') {
      return { channel: 'email', type: 'refund_processed' };
    } else if (setting === 'emailWeeklySummary') {
      return { channel: 'email', type: 'weekly_summary' };
    } else if (setting === 'smsPaymentReceived') {
      return { channel: 'sms', type: 'payment_received' };
    } else if (setting === 'smsRefundProcessed') {
      return { channel: 'sms', type: 'refund_processed' };
    }
    
    return null;
  },

  /**
   * Maps a UI setting key to a user-friendly name
   */
  getSettingDisplayName(setting: string): string {
    const displayNames: Record<string, string> = {
      emailPaymentReceived: "Payment received email notifications",
      emailRefundProcessed: "Refund processed email notifications",
      emailWeeklySummary: "Weekly summary email notifications",
      smsPaymentReceived: "Payment received SMS notifications",
      smsRefundProcessed: "Refund processed SMS notifications"
    };
    
    return displayNames[setting] || setting;
  }
};
