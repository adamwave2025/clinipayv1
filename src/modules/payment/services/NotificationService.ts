// Here we're just fixing imports to use types from the types directory
import { toast } from 'sonner';
import { StandardNotificationPayload } from '../types/notification';
import { getUserClinicId } from '@/utils/userUtils';

// Export the NotificationService class/functions but not the types
export class NotificationService {
  static async sendNotification(payload: StandardNotificationPayload): Promise<any> {
    try {
      // Simulate sending a notification
      console.log('Sending notification with payload:', payload);

      // Extract clinic ID from the payload
      const clinicId = payload.clinic.id;

      // Check if clinic ID is available
      if (!clinicId) {
        console.error('Clinic ID is missing in the notification payload.');
        toast.error('Clinic ID is missing in the notification payload.');
        return { success: false, error: 'Clinic ID is missing' };
      }

      // Call the Supabase function to trigger the notification
      const response = await fetch('/api/trigger-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the function call was successful
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to trigger notification:', errorData);
        toast.error(`Failed to trigger notification: ${errorData.message || 'Unknown error'}`);
        return { success: false, error: errorData.message || 'Failed to trigger notification' };
      }

      const result = await response.json();

      // Log the result of the function call
      console.log('Notification triggered successfully:', result);
      toast.success('Notification triggered successfully.');

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(`Error sending notification: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message || 'Error sending notification' };
    }
  }
}
