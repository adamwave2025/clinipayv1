
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DashboardActions from '@/components/dashboard/DashboardActions';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { useUserRole } from '@/hooks/useUserRole';

const DashboardPage = () => {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is an admin, redirect to admin dashboard
    if (!loading && role === 'admin') {
      navigate('/admin');
    }
  }, [role, loading, navigate]);

  return (
    <DashboardLayout userType="clinic">
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
