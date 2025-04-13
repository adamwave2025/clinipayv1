
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationSettingsProps {
  emailNotifications: boolean;
  smsNotifications: boolean;
  onToggleEmailNotifications: (enabled: boolean) => void;
  onToggleSmsNotifications: (enabled: boolean) => void;
}

const NotificationSettings = ({
  emailNotifications,
  smsNotifications,
  onToggleEmailNotifications,
  onToggleSmsNotifications,
}: NotificationSettingsProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive important clinic notifications via email</p>
            </div>
            <Switch 
              checked={emailNotifications}
              onCheckedChange={onToggleEmailNotifications}
            />
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive important clinic notifications via SMS</p>
              </div>
              <Switch 
                checked={smsNotifications}
                onCheckedChange={onToggleSmsNotifications}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
