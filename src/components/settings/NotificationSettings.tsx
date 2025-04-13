
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const NotificationSettings = () => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
        <p className="text-sm text-gray-500">
          Notification settings are currently not available.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
