import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useClinicData, ClinicData } from '@/hooks/useClinicData';
import { NotificationService } from '@/services/NotificationService';

// Import the component files
import ProfileSettings from '@/components/settings/ProfileSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';

const SettingsPage = () => {
  const { 
    clinicData, 
    isLoading: dataLoading, 
    isUploading,
    notificationSettings,
    updateClinicData,
    uploadLogo,
    deleteLogo,
    updateNotificationSetting
  } = useClinicData();
  
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

  const handleNotificationChange = (setting: string, checked: boolean) => {
    updateNotificationSetting(setting, checked);
    
    const settingName = NotificationService.getSettingDisplayName(setting);
    
    const statusText = checked ? "enabled" : "disabled";
    
    toast.success(`${settingName} ${statusText}`);
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

  const handleFileUpload = async (file: File) => {
    await uploadLogo(file);
  };

  const handleDeleteLogo = async () => {
    await deleteLogo();
  };

  const handleConnectStripe = async () => {
    toast.info('Connecting to Stripe...');
    
    try {
      const result = await updateClinicData({
        stripe_account_id: 'acct_' + Math.random().toString(36).substring(2, 15),
      });
      
      if (result.success) {
        toast.success('Successfully connected to Stripe');
      } else {
        toast.error('Failed to connect to Stripe');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('An error occurred while connecting to Stripe');
    }
  };

  const handleDisconnectStripe = async () => {
    toast.info('Disconnecting from Stripe...');
    
    try {
      const result = await updateClinicData({
        stripe_account_id: null,
      });
      
      if (result.success) {
        toast.success('Successfully disconnected from Stripe');
      } else {
        toast.error('Failed to disconnect from Stripe');
      }
    } catch (error) {
      console.error('Error disconnecting from Stripe:', error);
      toast.error('An error occurred while disconnecting from Stripe');
    }
  };

  const handleUpdatePassword = () => {
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
          <ProfileSettings 
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSaveProfile}
            isSubmitting={isSubmitting}
            handleFileUpload={handleFileUpload}
            handleDeleteLogo={handleDeleteLogo}
            isUploading={isUploading}
          />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentSettings 
            stripeAccountId={clinicData?.stripe_account_id || null}
            handleConnectStripe={handleConnectStripe}
            handleDisconnectStripe={handleDisconnectStripe}
          />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings 
            notificationSettings={notificationSettings}
            handleNotificationChange={handleNotificationChange}
          />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettings handleUpdatePassword={handleUpdatePassword} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;
