
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
  
  // React state is the source of truth, not URL params
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  const [lastStableTab, setLastStableTab] = useState(initialTab || 'profile');
  const [isChangingTab, setIsChangingTab] = useState(false);
  
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
    if (!VALID_TABS.includes(value)) {
      console.warn(`Invalid tab value: ${value}, defaulting to profile`);
      value = 'profile';
    }
    
    // Mark that we're in the process of changing tabs to prevent oscillation
    setIsChangingTab(true);
    setActiveTab(value);
    setLastStableTab(value);
    
    // Update URL without triggering a re-render
    setSearchParams({ tab: value }, { replace: true });
    
    // Clear the changing state after a timeout to prevent rapid changes
    setTimeout(() => {
      setIsChangingTab(false);
    }, 100);
  }, [setSearchParams]);
  
  // Sync URL with state on initial load and when URL changes externally
  // Only update if we're not in the middle of changing tabs
  useEffect(() => {
    if (isChangingTab) return;
    
    const tabParam = searchParams.get('tab');
    
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      console.log(`URL tab changed to ${tabParam}, updating state`);
      setActiveTab(tabParam);
      setLastStableTab(tabParam);
    } else if (!tabParam && activeTab !== 'profile') {
      // If no tab param, default to profile
      console.log(`No tab param, defaulting to profile`);
      setActiveTab('profile');
      setLastStableTab('profile');
      // Update URL to include tab=profile
      setSearchParams({ tab: 'profile' }, { replace: true });
    }
  }, [searchParams, activeTab, isChangingTab, setSearchParams]);

  // If something goes wrong, fall back to the last stable tab
  useEffect(() => {
    if (!VALID_TABS.includes(activeTab)) {
      console.warn(`Active tab ${activeTab} is invalid, falling back to ${lastStableTab}`);
      setActiveTab(lastStableTab);
      setSearchParams({ tab: lastStableTab }, { replace: true });
    }
  }, [activeTab, lastStableTab, setSearchParams]);

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
