
// This file is kept as a placeholder to avoid breaking imports,
// but all functionality has been moved to notification-stub.ts

import { supabase } from '@/integrations/supabase/client';
import { NotificationResponse, RecipientType } from './types';
import { addToNotificationQueue as addToQueue } from '../notification-stub';

// Re-export the functions from notification-stub
export const addToNotificationQueue = addToQueue;
export const processNotificationsNow = async (): Promise<{ success: boolean; processed: number; failed: number }> => {
  console.log('Redirecting to notification stub system');
  return {
    success: true,
    processed: 0,
    failed: 0
  };
};

export const checkNotificationExists = async (
  type: string,
  recipient_type: RecipientType,
  reference_id: string
): Promise<boolean> => {
  console.log('Queue service redirecting to notification stub system');
  return false;
};
