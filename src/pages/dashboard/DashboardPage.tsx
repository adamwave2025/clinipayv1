
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DashboardActions from '@/components/dashboard/DashboardActions';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { useUserRole } from '@/hooks/useUserRole';

const DashboardPage = () => {
  const { role } = useUserRole();

  return (
    <DashboardLayout userType={role === 'admin' ? 'admin' : 'clinic'}>
      <PageHeader 
        title="Dashboard" 
        description="View and manage your payments"
        action={<DashboardActions />}
      />
      
      <DashboardDataProvider>
        <DashboardContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default DashboardPage;
