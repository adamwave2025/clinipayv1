
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { useClinicData } from '@/hooks/useClinicData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

// Import the tab content components
import ProfileTab from './ProfileTab';
import PaymentSettings from '@/components/settings/PaymentSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { handlePaymentAction } from './PaymentActions';

const VALID_TABS = ['profile', 'payments', 'notifications', 'security'];

const SettingsContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or use default
  const initialTabParam = searchParams.get('tab');
  const initialTab = VALID_TABS.includes(initialTabParam as string) ? initialTabParam : 'profile';
  
  // Use React state for tab switching to prevent URL dependency issues
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { 
    clinicData, 
    isLoading: dataLoading, 
    isUploading,
    updateClinicData,
    uploadLogo,
    deleteLogo
  } = useClinicData();

  // Update URL when tab changes, but don't depend on URL for state
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Update URL without triggering a re-render
    setSearchParams({ tab: value }, { replace: true });
  }, [setSearchParams]);
  
  // Sync URL with state on initial load and when URL changes externally
  useEffect(() => {
    if (initialTabParam && VALID_TABS.includes(initialTabParam)) {
      setActiveTab(initialTabParam);
    }
  }, [initialTabParam]);

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
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 max-w-3xl mb-6">
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
          <ProfileTab
            clinicData={clinicData}
            uploadLogo={uploadLogo}
            deleteLogo={deleteLogo}
            updateClinicData={updateClinicData}
            isUploading={isUploading}
          />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentSettings 
            stripeAccountId={clinicData?.stripe_account_id || null}
            stripeStatus={clinicData?.stripe_status || null}
            handleConnectStripe={() => handlePaymentAction('connect', updateClinicData)}
            handleDisconnectStripe={() => handlePaymentAction('disconnect', updateClinicData)}
          />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsContainer;
