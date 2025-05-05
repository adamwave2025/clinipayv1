
import React from 'react';
import { PlusCircle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { 
  ManagePlansProvider, 
  ManagePlansContent, 
  ManagePlansDialogs 
} from './manage-plans';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';

const ManagePlansHeader: React.FC = () => {
  const { handleCreatePlanClick, handleViewPlansClick } = useManagePlansContext();
  
  return (
    <PageHeader 
      title="Manage Plans" 
      description="Create and manage payment plans for your patients"
      action={
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="flex items-center"
            onClick={handleViewPlansClick}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            View Plans
          </Button>
          <Button 
            className="btn-gradient flex items-center"
            onClick={handleCreatePlanClick}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      }
    />
  );
};

const ManagePlansPageContent: React.FC = () => {
  return (
    <>
      <ManagePlansHeader />
      <ManagePlansContent />
      <ManagePlansDialogs />
    </>
  );
};

const ManagePlansPage: React.FC = () => {
  return (
    <DashboardLayout userType="clinic">
      <DashboardDataProvider>
        <ManagePlansProvider>
          <ManagePlansPageContent />
        </ManagePlansProvider>
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default ManagePlansPage;
