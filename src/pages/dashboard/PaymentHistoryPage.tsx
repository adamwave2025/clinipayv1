
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import PaymentHistoryContent from '@/components/dashboard/payments/PaymentHistoryContent';

const PaymentHistoryPage = () => {
  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment History" 
        description="View and manage all your payment transactions"
      />
      
      <DashboardDataProvider>
        <PaymentHistoryContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default PaymentHistoryPage;
