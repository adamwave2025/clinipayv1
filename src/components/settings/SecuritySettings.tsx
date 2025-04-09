
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface SecuritySettingsProps {
  handleUpdatePassword: () => void;
}

const SecuritySettings = ({ handleUpdatePassword }: SecuritySettingsProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Security Settings</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Change Password</h4>
            <p className="text-sm text-gray-500 mb-4">
              Update your password regularly to keep your account secure.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full input-focus"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full input-focus"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full input-focus"
                />
              </div>
              
              <Button className="btn-gradient" onClick={handleUpdatePassword}>
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
