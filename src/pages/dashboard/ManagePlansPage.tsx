
import React, { useState, useCallback } from 'react';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { 
  ManagePlansProvider, 
  ManagePlansContent, 
  ManagePlansDialogs 
} from './manage-plans';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { PaymentLink } from '@/types/payment';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import CreatePlanSheet from '@/components/dashboard/payment-plans/CreatePlanSheet';
import PlanTemplatesView from '@/components/dashboard/payment-plans/PlanTemplatesView';

const ManagePlansHeader: React.FC<{
  isTemplateView: boolean;
  onCreatePlanClick: () => void;
  onViewTemplatesClick: () => void;
  onBackToPlans: () => void;
}> = ({ isTemplateView, onCreatePlanClick, onViewTemplatesClick, onBackToPlans }) => {
  return (
    <PageHeader 
      title="Payment Plans" 
      description="Create and manage payment plans for your patients"
      action={
        <div className="flex space-x-2">
          {isTemplateView ? (
            <>
              <Button 
                variant="outline"
                onClick={onBackToPlans}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patient Plans
              </Button>
              <Button 
                className="btn-gradient flex items-center"
                onClick={onCreatePlanClick}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={onViewTemplatesClick}
            >
              View Plan Templates
            </Button>
          )}
        </div>
      }
    />
  );
};

const ManagePlansPageContent: React.FC = () => {
  const [isTemplateView, setIsTemplateView] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const { createPaymentLink } = usePaymentLinks();
  
  // Add a function to refresh the templates view
  const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    console.log('Triggering templates refresh');
    setTemplateRefreshTrigger(prev => prev + 1);
  }, []);
  
  const handleCreatePlanClick = () => {
    setCreateSheetOpen(true);
  };

  const handleViewTemplatesClick = () => {
    setIsTemplateView(true);
  };
  
  const handleBackToPlans = () => {
    setIsTemplateView(false);
  };

  return (
    <>
      <ManagePlansHeader 
        isTemplateView={isTemplateView}
        onCreatePlanClick={handleCreatePlanClick}
        onViewTemplatesClick={handleViewTemplatesClick}
        onBackToPlans={handleBackToPlans}
      />

      {isTemplateView ? (
        <PlanTemplatesView 
          onBackToPlans={handleBackToPlans} 
          refreshTrigger={templateRefreshTrigger}
        />
      ) : (
        <ManagePlansContent />
      )}
      
      <ManagePlansDialogs />
      
      <CreatePlanSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        createPaymentLink={createPaymentLink}
        onPlanCreated={refreshTemplates}
      />
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
