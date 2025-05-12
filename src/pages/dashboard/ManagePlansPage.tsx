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
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const viewParam = searchParams.get('view');
  
  const [isTemplateView, setIsTemplateView] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const { createPaymentLink } = usePaymentLinks();
  
  // Add a function to refresh the templates view
  const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
  
  // Check URL parameters on component mount and on viewParam changes
  useEffect(() => {
    console.log('URL view param changed:', viewParam);
    // Set isTemplateView based on URL parameter
    if (viewParam === 'active') {
      console.log('Setting view to active plans based on URL');
      setIsTemplateView(false);
    } else if (viewParam === 'templates') {
      console.log('Setting view to templates based on URL');
      setIsTemplateView(true);
    }
  }, [viewParam]);
  
  // Update URL when isTemplateView changes
  useEffect(() => {
    console.log('isTemplateView state changed to:', isTemplateView);
    // Update URL to match the current view without triggering a full page reload
    const newParams = new URLSearchParams(searchParams);
    if (isTemplateView) {
      newParams.set('view', 'templates');
    } else {
      newParams.set('view', 'active');
    }
    setSearchParams(newParams);
  }, [isTemplateView, setSearchParams]);
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    console.log('Triggering templates refresh');
    setTemplateRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Enhanced function for handling plan creation with better state control
  const handlePlanCreated = useCallback(() => {
    console.log('Plan created, handling state transitions...');
    
    // First refresh the templates data to keep templates up to date
    setTemplateRefreshTrigger(prev => prev + 1);
    
    // Force navigation to ensure we're on the active plans view
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Set local state to match (with slight delay to ensure it happens after navigation)
    setTimeout(() => {
      console.log('Setting isTemplateView to false');
      setIsTemplateView(false);
    }, 10);
    
    // Show success toast to confirm the action
    toast.success("Payment plan created successfully");
  }, [navigate]);
  
  const handleCreatePlanClick = () => {
    console.log("ManagePlansPage: handleCreatePlanClick");
    setCreateSheetOpen(true);
  };

  const handleViewTemplatesClick = () => {
    console.log("ManagePlansPage: handleViewTemplatesClick");
    navigate('/dashboard/manage-plans?view=templates');
    setIsTemplateView(true);
  };
  
  const handleBackToPlans = () => {
    console.log("ManagePlansPage: handleBackToPlans");
    navigate('/dashboard/manage-plans?view=active');
    setIsTemplateView(false);
  };

  // Log current state for debugging
  console.log('Current view state:', { isTemplateView, viewParam });

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
        onPlanCreated={handlePlanCreated}
      />
      
      <Toaster />
    </>
  );
};

// Render a ManagePlansProvider that wraps the content
const ManagePlansPage: React.FC = () => {
  console.log("Rendering ManagePlansPage");
  
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
