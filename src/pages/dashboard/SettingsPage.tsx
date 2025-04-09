
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useClinicData, ClinicData } from '@/hooks/useClinicData';

const SettingsPage = () => {
  const { clinicData, isLoading: dataLoading, updateClinicData } = useClinicData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<Partial<ClinicData>>({
    clinic_name: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    logo_url: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailPayments: false,
    emailRefunds: false,
    emailSummary: false,
    smsPayments: false,
    smsRefunds: false,
  });

  // Update the form when clinic data is loaded
  useEffect(() => {
    if (clinicData) {
      setProfileData({
        clinic_name: clinicData.clinic_name || '',
        email: clinicData.email || '',
        phone: clinicData.phone || '',
        address_line_1: clinicData.address_line_1 || '',
        address_line_2: clinicData.address_line_2 || '',
        city: clinicData.city || '',
        postcode: clinicData.postcode || '',
        logo_url: clinicData.logo_url || '',
      });
    }
  }, [clinicData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: checked }));
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await updateClinicData({
        clinic_name: profileData.clinic_name || null,
        email: profileData.email || null,
        phone: profileData.phone || null,
        address_line_1: profileData.address_line_1 || null,
        address_line_2: profileData.address_line_2 || null,
        city: profileData.city || null,
        postcode: profileData.postcode || null,
        logo_url: profileData.logo_url || null,
      });
      
      if (result.success) {
        toast.success('Profile settings saved successfully');
      } else {
        toast.error('Failed to save profile settings');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving profile settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated');
  };

  const handleConnectStripe = () => {
    toast.info('Redirecting to Stripe Connect...');
  };

  const handleUpdatePassword = () => {
    // Mock password update
    toast.success('Password updated successfully');
  };

  if (dataLoading) {
    return (
      <DashboardLayout userType="clinic">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Settings" 
        description="Manage your clinic settings and preferences"
      />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-2xl mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileData.logo_url || ''} alt="Clinic Logo" />
                    <AvatarFallback className="bg-gradient-primary text-white text-4xl">
                      {profileData.clinic_name ? profileData.clinic_name.charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="w-full">
                    Upload Logo
                  </Button>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clinic Name</Label>
                    <Input
                      id="clinic_name"
                      name="clinic_name"
                      value={profileData.clinic_name || ''}
                      onChange={handleProfileChange}
                      className="w-full input-focus"
                      placeholder="Enter clinic name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email || ''}
                      onChange={handleProfileChange}
                      className="w-full input-focus"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profileData.phone || ''}
                      onChange={handleProfileChange}
                      className="w-full input-focus"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                      id="address_line_1"
                      name="address_line_1"
                      value={profileData.address_line_1 || ''}
                      onChange={handleProfileChange}
                      className="w-full input-focus"
                      placeholder="Enter address line 1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      name="address_line_2"
                      value={profileData.address_line_2 || ''}
                      onChange={handleProfileChange}
                      className="w-full input-focus"
                      placeholder="Enter address line 2 (optional)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city || ''}
                        onChange={handleProfileChange}
                        className="w-full input-focus"
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        name="postcode"
                        value={profileData.postcode || ''}
                        onChange={handleProfileChange}
                        className="w-full input-focus"
                        placeholder="Enter postcode"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile} 
                    className="btn-gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Payment Processing</h3>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Stripe Connect</h4>
                    <p className="text-sm text-gray-500">Status: Not Connected</p>
                  </div>
                  <Button onClick={handleConnectStripe} className="btn-gradient">
                    Connect Stripe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
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
                        checked={notificationSettings.emailPayments}
                        onCheckedChange={(checked) => handleNotificationChange('emailPayments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Refund Processed</p>
                        <p className="text-sm text-gray-500">Get notified when a refund is processed</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailRefunds}
                        onCheckedChange={(checked) => handleNotificationChange('emailRefunds', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Summary</p>
                        <p className="text-sm text-gray-500">Receive a weekly summary of all transactions</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.emailSummary}
                        onCheckedChange={(checked) => handleNotificationChange('emailSummary', checked)}
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
                        checked={notificationSettings.smsPayments}
                        onCheckedChange={(checked) => handleNotificationChange('smsPayments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Refund Processed</p>
                        <p className="text-sm text-gray-500">Get SMS alerts for refunds</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.smsRefunds}
                        onCheckedChange={(checked) => handleNotificationChange('smsRefunds', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveNotifications} 
                  className="btn-gradient"
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
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
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;
