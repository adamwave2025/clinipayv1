
import React, { useEffect, useRef } from 'react';
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
const DEFAULT_TAB = 'profile';

const SettingsContainer = () => {
  // Use React Router hooks
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Track initialization to prevent unnecessary updates
  const initialized = useRef(false);
  const userAction = useRef(false);
  
  // Get current tab from URL params
  const currentTab = searchParams.get('tab');
  const stripeConnected = searchParams.get('stripe_connected');
  
  // Make sure the tab is valid
  const safeTab = VALID_TABS.includes(currentTab || '') ? currentTab : DEFAULT_TAB;
  
  const { 
    clinicData, 
    isLoading: dataLoading, 
    isUploading,
    updateClinicData,
    uploadLogo,
    deleteLogo,
    fetchClinicData
  } = useClinicData();
  
  // Set the initial tab parameter if needed (only once)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      if (!currentTab) {
        console.log('No tab parameter found, initializing with default tab:', DEFAULT_TAB);
        setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
      } else if (currentTab !== safeTab) {
        console.log(`Invalid tab detected: ${currentTab}, correcting to ${safeTab}`);
        setSearchParams({ tab: safeTab }, { replace: true });
      }
    }
  }, [currentTab, safeTab, setSearchParams]);

  // Handle Stripe connection return - refresh clinic data and clean up URL
  useEffect(() => {
    if (stripeConnected === 'true') {
      console.log('Stripe connection detected, refreshing clinic data');
      fetchClinicData();
      
      // Clean up the stripe_connected parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('stripe_connected');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [stripeConnected, fetchClinicData, searchParams, setSearchParams]);
  
  // Handle tab selection from UI (direct user action)
  const handleTabChange = (value: string) => {
    if (value !== currentTab) {
      console.log(`Tab selected by user: ${value}`);
      userAction.current = true;
      setSearchParams({ tab: value }, { replace: true });
    }
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
      
      <Tabs value={safeTab || DEFAULT_TAB} onValueChange={handleTabChange} className="w-full">
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
