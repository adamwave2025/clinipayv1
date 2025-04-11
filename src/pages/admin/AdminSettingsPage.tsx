
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PlatformFeeSettings from '@/components/admin/settings/PlatformFeeSettings';
import StripeConnectManagement from '@/components/admin/settings/StripeConnectManagement';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const AdminSettingsPage = () => {
  const { 
    platformFee, 
    clinics, 
    setClinics, 
    isLoading, 
    fetchPlatformFee,
    fetchClinics 
  } = useAdminSettings();

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Settings" 
        description="Configure global platform settings"
      />
      
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Admin Access</AlertTitle>
          <AlertDescription className="text-blue-700">
            As an admin, you can manage platform fees and disconnect Stripe integrations for clinics.
          </AlertDescription>
        </Alert>
        
        <PlatformFeeSettings 
          initialFee={platformFee} 
          onSave={fetchPlatformFee}
        />
        
        <StripeConnectManagement 
          clinics={clinics} 
          isLoading={isLoading}
          onUpdateClinics={setClinics}
          refetchClinics={fetchClinics}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
