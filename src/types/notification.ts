
/**
 * Interface representing notification settings for a clinic
 */
export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
}

/**
 * Interface representing notification methods based on available patient contact info
 */
export interface NotificationMethod {
  email: boolean;
  sms: boolean;
}
