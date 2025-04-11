
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DashboardActions from '@/components/dashboard/DashboardActions';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const DashboardPage = () => {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If the user is an admin, redirect them to the admin dashboard
    if (!loading && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [role, loading, navigate]);
  
  // Show loading while checking role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Only render if not admin (admin will be redirected)
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
