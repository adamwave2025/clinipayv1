
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationSettings as NotificationSettingsType } from '@/services/NotificationService';

interface NotificationSettingsProps {
  notificationSettings: NotificationSettingsType;
  handleNotificationChange: (setting: string, checked: boolean) => void;
  handleSaveNotifications: () => void;
  isSubmitting?: boolean;
}

const NotificationSettings = ({
  notificationSettings,
  handleNotificationChange,
  handleSaveNotifications,
  isSubmitting = false
}: NotificationSettingsProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Email Notifications</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-gray-500">Get notified when a payment is received</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailPaymentReceived}
                  onCheckedChange={(checked) => handleNotificationChange('emailPaymentReceived', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Refund Processed</p>
                  <p className="text-sm text-gray-500">Get notified when a refund is processed</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailRefundProcessed}
                  onCheckedChange={(checked) => handleNotificationChange('emailRefundProcessed', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Summary</p>
                  <p className="text-sm text-gray-500">Receive a weekly summary of all transactions</p>
                </div>
                <Switch 
                  checked={notificationSettings.emailWeeklySummary}
                  onCheckedChange={(checked) => handleNotificationChange('emailWeeklySummary', checked)}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-4">SMS Notifications</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-gray-500">Get SMS alerts for new payments</p>
                </div>
                <Switch 
                  checked={notificationSettings.smsPaymentReceived}
                  onCheckedChange={(checked) => handleNotificationChange('smsPaymentReceived', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Refund Processed</p>
                  <p className="text-sm text-gray-500">Get SMS alerts for refunds</p>
                </div>
                <Switch 
                  checked={notificationSettings.smsRefundProcessed}
                  onCheckedChange={(checked) => handleNotificationChange('smsRefundProcessed', checked)}
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveNotifications} 
            className="btn-gradient"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
