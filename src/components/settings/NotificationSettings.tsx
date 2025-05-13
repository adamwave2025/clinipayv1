
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

const NotificationSettings = () => {
  const { clinicData, updateClinicData, isLoading } = useClinicData();
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [smsNotifications, setSmsNotifications] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Initialize state from clinic data when available
  useEffect(() => {
    if (clinicData) {
      setEmailNotifications(clinicData.email_notifications ?? true);
      setSmsNotifications(clinicData.sms_notifications ?? true);
    }
  }, [clinicData]);

  const handleSave = async () => {
    if (!clinicData) {
      toast.error('Clinic data not available');
      return;
    }
    
    setSaveLoading(true);
    
    try {
      const result = await updateClinicData({
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
      });
      
      if (result.success) {
        toast.success('Notification settings updated successfully');
      } else if ('error' in result) {
        toast.error(`Failed to update notification settings: ${result.error || 'Unknown error'}`);
      } else {
        toast.error('Failed to update notification settings');
      }
    } catch (error: any) {
      toast.error(`Error updating notification settings: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how you want to be notified about new payments and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base" htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-gray-500">
              Receive updates about payments, reminders, and account activity via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base" htmlFor="sms-notifications">SMS Notifications</Label>
            <p className="text-sm text-gray-500">
              Receive text messages for important alerts and payment confirmations
            </p>
          </div>
          <Switch
            id="sms-notifications"
            checked={smsNotifications}
            onCheckedChange={setSmsNotifications}
          />
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saveLoading}
            className="w-full sm:w-auto"
          >
            {saveLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
