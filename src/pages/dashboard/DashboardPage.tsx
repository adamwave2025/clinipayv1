
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Combined loading state
  const isLoading = authLoading || roleLoading;
  
  useEffect(() => {
    // Only redirect after both auth and role are fully loaded
    if (!isLoading && role === 'admin' && user) {
      console.log('DashboardPage: User is admin, redirecting to admin dashboard');
      navigate('/admin', { replace: true });
    }
  }, [role, isLoading, navigate, user]);
  
  // Enhanced logging
  console.log('DashboardPage:', {
    authLoading,
    roleLoading,
    isLoading,
    role,
    user: user?.id,
    redirectingToAdmin: !isLoading && role === 'admin'
  });
  
  // Show loading while checking role
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            {authLoading ? "Verifying your account..." : "Checking user role..."}
          </p>
        </div>
      </div>
    );
  }
  
  // Only render if not admin (admin will be redirected)
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
