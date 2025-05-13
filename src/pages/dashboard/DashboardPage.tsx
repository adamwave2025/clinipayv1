
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const { role } = useUnifiedAuth();
  
  // No need for checking loading or redirect here - this is now handled by RoleRoute
  console.log('[DASHBOARD PAGE] Rendering with role:', role);
  
  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Dashboard" 
        description="View and manage your payments"
      />
      
      <DashboardDataProvider>
        <DashboardContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default DashboardPage;
