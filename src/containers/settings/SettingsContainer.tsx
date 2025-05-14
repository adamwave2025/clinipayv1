
import React, { useState, useEffect, useRef } from 'react';
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
  // Use React Router hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Get initial tab from URL or default to 'profile'
  const initialTab = searchParams.get('tab') || 'profile';
  const validInitialTab = VALID_TABS.includes(initialTab) ? initialTab : 'profile';
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState(validInitialTab);
  
  // Track URL updates to prevent loops
  const urlUpdateRef = useRef({
    isUpdating: false,
    lastPath: location.pathname,
    lastTab: validInitialTab,
    ignoreNextUpdate: false
  });

  // Initialize once from URL on component mount
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'profile';
    if (VALID_TABS.includes(urlTab)) {
      setActiveTab(urlTab);
      urlUpdateRef.current.lastTab = urlTab;
    } else if (urlTab !== 'profile') {
      // If invalid tab in URL, reset to profile
      setSearchParams({ tab: 'profile' }, { replace: true });
    }
  }, []); // Empty dependency array ensures this only runs once on mount
  
  // Handle URL changes from external navigation (like sidebar)
  useEffect(() => {
    // Skip if we're in the middle of our own update
    if (urlUpdateRef.current.isUpdating) {
      urlUpdateRef.current.isUpdating = false;
      return;
    }

    // Skip if path hasn't changed (tab change within settings)
    if (location.pathname === urlUpdateRef.current.lastPath) {
      const urlTab = searchParams.get('tab') || 'profile';
      
      // Only update state if the tab actually changed and is valid
      if (urlTab !== activeTab && VALID_TABS.includes(urlTab)) {
        console.log(`External tab change detected: ${activeTab} -> ${urlTab}`);
        setActiveTab(urlTab);
        urlUpdateRef.current.lastTab = urlTab;
      }
    }
    
    // Update last known path
    urlUpdateRef.current.lastPath = location.pathname;
  }, [location, searchParams, activeTab]);
  
  // Handle tab selection from UI
  const handleTabChange = (value: string) => {
    console.log(`Tab selected by user: ${value}`);
    
    // Skip update if already on this tab
    if (value === activeTab) return;
    
    // Update state first
    setActiveTab(value);
    urlUpdateRef.current.lastTab = value;
    
    // Then update URL, marking that we're doing the update
    urlUpdateRef.current.isUpdating = true;
    setSearchParams({ tab: value }, { replace: true });
  };

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
