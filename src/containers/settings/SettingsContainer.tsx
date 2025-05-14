
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from "sonner";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';

// Import the tab content components
import ProfileTab from './ProfileTab';
import PaymentSettings from '@/components/settings/PaymentSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { handlePaymentAction } from './PaymentActions';

// Define valid tabs and default tab
const VALID_TABS = ['profile', 'payments', 'notifications', 'security'];
const DEFAULT_TAB = 'profile';

const SettingsContainer = () => {
  // Get URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State flags using refs to avoid re-renders
  const initialized = useRef(false);
  const processingUrlChange = useRef(false);
  const userAction = useRef(false);
  
  // Local state for the current tab
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  
  // Get current tab from URL params
  const urlTabParam = searchParams.get('tab');
  
  // Validate the tab parameter
  const getValidTab = (tab: string | null): string => {
    if (!tab || !VALID_TABS.includes(tab)) {
      return DEFAULT_TAB;
    }
    return tab;
  };
  
  // Debug log for initial render
  console.log('🏁 SettingsContainer rendering. URL tab:', urlTabParam, 'Active tab:', activeTab);
  
  // Effect to synchronize URL parameters with component state
  useEffect(() => {
    console.log('🔄 Running tab sync effect. URL tab:', urlTabParam, 'Active tab:', activeTab, 
                'Processing URL:', processingUrlChange.current, 'User Action:', userAction.current);
    
    // Skip this effect run if we're already processing a URL change
    if (processingUrlChange.current) {
      console.log('⏭️ Skipping - already processing URL change');
      return;
    }
    
    // Handle initialization
    if (!initialized.current) {
      initialized.current = true;
      const validTab = getValidTab(urlTabParam);
      
      console.log('🚀 Initializing with tab:', validTab);
      
      // Update local state
      setActiveTab(validTab);
      
      // If URL doesn't match valid tab, update URL (replace to avoid history entry)
      if (validTab !== urlTabParam) {
        console.log('📝 Correcting URL parameter to:', validTab);
        processingUrlChange.current = true;
        setSearchParams({ tab: validTab }, { replace: true });
        // Reset this flag after execution completes (not in this block)
        setTimeout(() => {
          processingUrlChange.current = false;
          console.log('🔄 Reset processing flag after URL change');
        }, 0);
      }
      
      return;
    }
    
    // When URL changes externally (navigation from sidebar)
    if (urlTabParam !== activeTab && !userAction.current) {
      console.log('🔀 URL changed externally to:', urlTabParam);
      const validTab = getValidTab(urlTabParam);
      
      // Update local state to match URL
      console.log('📝 Updating active tab to match URL:', validTab);
      setActiveTab(validTab);
    }
    
    // Reset user action flag after processing
    if (userAction.current) {
      console.log('🔄 Resetting user action flag');
      userAction.current = false;
    }
  }, [urlTabParam, activeTab, searchParams, setSearchParams]);
  
  // Handle user tab selection (direct UI interaction)
  const handleTabChange = (value: string) => {
    console.log('👆 User selected tab:', value);
    
    // Set the user action flag
    userAction.current = true;
    
    // Update local state first
    setActiveTab(value);
    
    // Then update URL (replace to avoid history entry)
    console.log('📝 Updating URL to match selected tab:', value);
    processingUrlChange.current = true;
    setSearchParams({ tab: value }, { replace: true });
    
    // Reset processing flag after the URL change completes
    setTimeout(() => {
      processingUrlChange.current = false;
      console.log('🔄 Reset processing flag after URL change');
    }, 0);
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
