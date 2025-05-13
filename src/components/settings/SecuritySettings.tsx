
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePassword } from '@/hooks/useUpdatePassword';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { updatePassword, isUpdating, error } = useUpdatePassword();
  const { user } = useUnifiedAuth();
  
  // Basic password validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isValidNewPassword = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword === confirmPassword;
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to change your password');
      return;
    }
    
    // Client-side validation
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (!isValidNewPassword) {
      toast.error('New password does not meet the security requirements');
      return;
    }
    
    if (!passwordsMatch) {
      toast.error('New passwords do not match');
      return;
    }
    
    // All validation passed, proceed with update
    const success = await updatePassword(currentPassword, newPassword);
    
    if (success) {
      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Update your password and manage account security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isUpdating}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isUpdating}
                className="mt-1"
              />
              
              {/* Password strength indicators */}
              <div className="mt-2 space-y-1 text-xs">
                <p className={hasMinLength ? "text-green-600" : "text-gray-500"}>
                  ✓ At least 8 characters
                </p>
                <p className={hasUppercase ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one uppercase letter
                </p>
                <p className={hasNumber ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one number
                </p>
                <p className={hasSpecial ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one special character
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isUpdating}
                className="mt-1"
              />
              
              {confirmPassword && (
                <p className={`text-xs mt-1 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              Error: {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={isUpdating || !isValidNewPassword || !passwordsMatch || !currentPassword} 
            className="w-full sm:w-auto"
          >
            {isUpdating ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
