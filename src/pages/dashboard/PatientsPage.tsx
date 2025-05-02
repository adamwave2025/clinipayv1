
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import PatientsContent from '@/components/dashboard/patients/PatientsContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const PatientsPage = () => {
  useDocumentTitle('Patients');
  
  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Patients" 
        description="Manage and view your patient information"
      />
      
      <DashboardDataProvider>
        <PatientsContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default PatientsPage;
