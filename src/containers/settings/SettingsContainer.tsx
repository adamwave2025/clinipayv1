
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Track whether we're in the middle of a URL transition to prevent infinite loops
  const isUpdatingUrlRef = React.useRef(false);
  
  // Get initial tab from URL or use default
  const initialTabParam = searchParams.get('tab');
  const initialTab = VALID_TABS.includes(initialTabParam as string) ? initialTabParam : 'profile';
  
  // React state is the source of truth, not URL params
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  
  // Update URL when tab changes, without triggering a re-render from URL change
  const handleTabChange = useCallback((value: string) => {
    if (!VALID_TABS.includes(value)) {
      console.warn(`Invalid tab value: ${value}, defaulting to profile`);
      value = 'profile';
    }
    
    // Set our state immediately
    setActiveTab(value);
    
    // Set a flag to ignore the next URL change event
    isUpdatingUrlRef.current = true;
    
    // Update URL
    setSearchParams({ tab: value }, { replace: true });
    
    // Clear the flag after the URL update has been processed
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
    }, 300);
  }, [setSearchParams]);
  
  // Sync from URL to state, but only when URL changes from external navigation
  useEffect(() => {
    // Skip if we're the ones who just updated the URL
    if (isUpdatingUrlRef.current) {
      return;
    }
    
    const tabParam = searchParams.get('tab');
    
    // Only update state if URL param exists and doesn't match current state
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      console.log(`Syncing tab state from URL: ${tabParam}`);
      setActiveTab(tabParam);
    } 
    // If no tab param, default to profile by updating URL (not state, to avoid loops)
    else if (!tabParam) {
      // Update URL but don't trigger state change
      isUpdatingUrlRef.current = true;
      setSearchParams({ tab: activeTab || 'profile' }, { replace: true });
      
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 300);
    }
  }, [location.search, searchParams, setSearchParams, activeTab]);
  
  const { 
    clinicData, 
    isLoading: dataLoading, 
    isUploading,
    updateClinicData,
    uploadLogo,
    deleteLogo
  } = useClinicData();

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
