
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Utility function to debounce function calls
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

const SettingsContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'profile'
  const initialUrlTab = searchParams.get('tab');
  const validInitialTab = VALID_TABS.includes(initialUrlTab as string) ? initialUrlTab : 'profile';
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState(validInitialTab);
  
  // References to track navigation state
  const navigationState = useRef({
    source: null as 'url' | 'user' | null,
    isInitialized: false,
    prevTab: validInitialTab,
    isUpdatingUrl: false
  });
  
  // Track renders for debugging
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Debounced URL update function to prevent rapid changes
  const debouncedSetSearchParams = useCallback(
    debounce((tab: string) => {
      if (!navigationState.current.isUpdatingUrl) {
        navigationState.current.isUpdatingUrl = true;
        // Use replace to avoid adding new history entries
        setSearchParams({ tab }, { replace: true });
        
        // Reset the flag after a short delay
        setTimeout(() => {
          navigationState.current.isUpdatingUrl = false;
        }, 50);
      }
    }, 100),
    [setSearchParams]
  );
  
  const { 
    clinicData, 
    isLoading: dataLoading, 
    isUploading,
    updateClinicData,
    uploadLogo,
    deleteLogo
  } = useClinicData();

  // Update tab from URL, but only if URL changed externally
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const validUrlTab = VALID_TABS.includes(urlTab as string) ? urlTab : 'profile';
    
    // On first render, initialize state from URL
    if (!navigationState.current.isInitialized) {
      setActiveTab(validUrlTab);
      navigationState.current.isInitialized = true;
      navigationState.current.source = 'url';
      return;
    }
    
    // If URL changed externally and we're not in the middle of our own update
    if (!navigationState.current.isUpdatingUrl && 
        validUrlTab !== activeTab && 
        navigationState.current.source !== 'user') {
      setActiveTab(validUrlTab);
      navigationState.current.source = 'url';
    }
    
    // If tab state was updated by user, update URL
    if (navigationState.current.source === 'user') {
      debouncedSetSearchParams(activeTab);
      // Reset source after handling
      navigationState.current.source = null;
    }
    
    // Update previous tab reference
    navigationState.current.prevTab = activeTab;
    
  }, [activeTab, searchParams, debouncedSetSearchParams]);

  // Safe tab change handler with guards against unnecessary updates
  const handleTabChange = useCallback((value: string) => {
    // Prevent unnecessary state updates
    if (value === activeTab) return;
    
    // Set the source to 'user' to track origin of change
    navigationState.current.source = 'user';
    
    // Update active tab state
    setActiveTab(value);
  }, [activeTab]);

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
