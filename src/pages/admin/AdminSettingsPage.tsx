
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PlatformFeeSettings from '@/components/admin/settings/PlatformFeeSettings';
import StripeConnectManagement from '@/components/admin/settings/StripeConnectManagement';
import { useAdminSettings } from '@/hooks/useAdminSettings';

const AdminSettingsPage = () => {
  const { platformFee, clinics, setClinics, isLoading, fetchPlatformFee } = useAdminSettings();

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Settings" 
        description="Configure global platform settings"
      />
      
      <div className="space-y-6">
        <PlatformFeeSettings 
          initialFee={platformFee} 
          // When the fee is updated, refresh the fee data
          onSave={fetchPlatformFee}
        />
        <StripeConnectManagement 
          clinics={clinics} 
          isLoading={isLoading}
          onUpdateClinics={setClinics}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
