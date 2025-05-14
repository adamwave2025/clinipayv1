
export interface PaymentNotification {
  id?: string;
  user_id?: string;
  type: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  recipient: string;
  subject?: string;
  message: string;
  created_at?: string;
  scheduled_for?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_confirmations: boolean;
  payment_reminders: boolean;
  marketing_updates: boolean;
}
