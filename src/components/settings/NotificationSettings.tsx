
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare } from 'lucide-react';

const NotificationSettings = () => {
  const { clinicData, updateClinicData, isLoading } = useClinicData();
  const [isSaving, setIsSaving] = useState(false);

  // Set default values when data loads
  const emailNotifications = clinicData?.email_notifications ?? true;
  const smsNotifications = clinicData?.sms_notifications ?? true;

  const handleNotificationToggle = async (type: 'email' | 'sms', checked: boolean) => {
    if (!clinicData) {
      toast.error('Unable to update settings: clinic data not available');
      return;
    }

    setIsSaving(true);
    
    try {
      const updateField = type === 'email' ? 'email_notifications' : 'sms_notifications';
      
      const result = await updateClinicData({
        [updateField]: checked
      });
      
      if (result.success) {
        toast.success(`${type === 'email' ? 'Email' : 'SMS'} notifications ${checked ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(`Failed to update ${type} notification settings`);
      }
    } catch (error) {
      console.error(`Error updating ${type} notification setting:`, error);
      toast.error(`Something went wrong updating your notification settings`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium">Notification Settings</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Control how you receive notifications about payments and account activities.
        </p>
        
        <div className="space-y-6">
          {/* Email notifications toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about payments and account activities via email.
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              disabled={isLoading || isSaving}
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
            />
          </div>
          
          {/* SMS notifications toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <Label htmlFor="sms-notifications" className="font-medium">
                  SMS Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about payments and account activities via SMS.
                </p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={smsNotifications}
              disabled={isLoading || isSaving}
              onCheckedChange={(checked) => handleNotificationToggle('sms', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
