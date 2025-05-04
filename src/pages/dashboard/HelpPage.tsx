
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import HelpSettings from '@/components/settings/HelpSettings';

const HelpPage = () => {
  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Help & Support" 
        description="Get help with CliniPay and connect with our support team"
      />
      <div className="mt-6">
        <HelpSettings />
      </div>
    </DashboardLayout>
  );
};

export default HelpPage;
