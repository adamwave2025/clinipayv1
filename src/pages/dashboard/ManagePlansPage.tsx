import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

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
  // Set document title for this page
  useDocumentTitle('Manage Payment Plans');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const viewParam = searchParams.get('view');
  
  const [isTemplateView, setIsTemplateView] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const { createPaymentLink } = usePaymentLinks();
  
  // Add a function to refresh the templates view
  const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
  
  // Add refs to prevent unnecessary updates and infinite loops
  const initialViewProcessed = useRef(false);
  const isUserAction = useRef(false);
  
  // Consolidated useEffect to handle URL parameters and state synchronization
  useEffect(() => {
    // If this is the initial load, process URL parameters
    if (!initialViewProcessed.current) {
      console.log('Initial processing of view param:', viewParam);
      
      if (viewParam === 'templates') {
        setIsTemplateView(true);
      } else {
        // Default to active plans
        setIsTemplateView(false);
      }
      
      initialViewProcessed.current = true;
    }
    // If state was changed by a user action, update URL parameters
    else if (isUserAction.current) {
      console.log('Updating URL based on user action to:', isTemplateView ? 'templates' : 'active');
      
      const newParams = new URLSearchParams(searchParams);
      newParams.set('view', isTemplateView ? 'templates' : 'active');
      setSearchParams(newParams, { replace: true }); // Use replace to avoid adding to history
      
      isUserAction.current = false;
    }
  }, [viewParam, isTemplateView, searchParams, setSearchParams]);

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
    
    // Mark as user action
    isUserAction.current = true;
    
    // Update state (which will trigger URL update via the useEffect)
    setIsTemplateView(false);
    
    // Show success toast to confirm the action
    toast.success("Payment plan created successfully");
  }, []);
  
  const handleCreatePlanClick = () => {
    console.log("ManagePlansPage: handleCreatePlanClick");
    setCreateSheetOpen(true);
  };

  const handleViewTemplatesClick = () => {
    console.log("ManagePlansPage: handleViewTemplatesClick");
    
    // Only update if state is actually changing
    if (!isTemplateView) {
      isUserAction.current = true;
      setIsTemplateView(true);
    }
  };
  
  const handleBackToPlans = () => {
    console.log("ManagePlansPage: handleBackToPlans");
    
    // Only update if state is actually changing
    if (isTemplateView) {
      isUserAction.current = true;
      setIsTemplateView(false);
    }
  };

  // Log current state for debugging
  console.log('Current view state:', { isTemplateView, viewParam, initialProcessed: initialViewProcessed.current });

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
        forceActiveView={() => {
          // Mark as user action
          isUserAction.current = true;
          setIsTemplateView(false);
        }}
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
