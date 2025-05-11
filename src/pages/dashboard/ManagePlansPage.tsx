import React, { useState, useCallback, useEffect } from 'react';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { 
  ManagePlansProvider, 
  ManagePlansContent
} from './manage-plans';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import { PaymentLink } from '@/types/payment';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import CreatePlanSheet from '@/components/dashboard/payment-plans/CreatePlanSheet';
import PlanTemplatesView from '@/components/dashboard/payment-plans/PlanTemplatesView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/sonner";

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

// Create a wrapper component that can access the context
const PaymentDetailsDialogWrapper = () => {
  const { paymentData, showPaymentDetails, setShowPaymentDetails } = useManagePlansContext();
  
  return (
    <PaymentDetailDialog
      payment={paymentData}
      open={showPaymentDetails}
      onOpenChange={setShowPaymentDetails}
    />
  );
};

const ManagePlansPageContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  
  const [isTemplateView, setIsTemplateView] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const { createPaymentLink } = usePaymentLinks();
  
  // Add a function to refresh the templates view
  const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
  
  // Check URL parameters on component mount
  useEffect(() => {
    // Set isTemplateView to false if view=active is in the URL
    if (viewParam === 'active') {
      setIsTemplateView(false);
    }
  }, [viewParam]);
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    console.log('Triggering templates refresh');
    setTemplateRefreshTrigger(prev => prev + 1);
  }, []);
  
  const handleCreatePlanClick = () => {
    console.log("ManagePlansPage: handleCreatePlanClick");
    toast.info("Opening Create Plan form");
    setCreateSheetOpen(true);
  };

  const handleViewTemplatesClick = () => {
    console.log("ManagePlansPage: handleViewTemplatesClick");
    toast.info("Switching to Templates view");
    setIsTemplateView(true);
  };
  
  const handleBackToPlans = () => {
    console.log("ManagePlansPage: handleBackToPlans");
    toast.info("Returning to Patient Plans view");
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
        <>
          <ManagePlansContent />
          <PaymentDetailsDialogWrapper />
        </>
      )}
      
      <CreatePlanSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        createPaymentLink={createPaymentLink}
        onPlanCreated={refreshTemplates}
      />
      
      {/* Use the Toaster component from our UI components */}
      <Toaster />
    </>
  );
};

// Render a ManagePlansProvider that wraps the content and passes setIsTemplateView
const ManagePlansPage: React.FC = () => {
  console.log("Rendering ManagePlansPage");
  
  useEffect(() => {
    // Log when the page mounts
    toast.info("Payment Plans page loaded");
  }, []);
  
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
