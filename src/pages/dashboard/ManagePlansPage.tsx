
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

// Component state interface to make it more explicit
interface ManagePlansPageState {
  isTemplateView: boolean;
  createSheetOpen: boolean;
  templateRefreshTrigger: number;
}

const ManagePlansPageContent: React.FC = () => {
  // Set document title for this page
  useDocumentTitle('Manage Payment Plans');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get view param from URL
  const viewParam = searchParams.get('view');
  
  // Use a ref to track initialization
  const isInitializedRef = useRef(false);
  
  // State is the source of truth, not URL parameters
  const [state, setState] = useState<ManagePlansPageState>(() => ({
    // Initialize from URL on first render only
    isTemplateView: viewParam === 'templates',
    createSheetOpen: false,
    templateRefreshTrigger: 0,
  }));
  
  // Destructure state for readability
  const { isTemplateView, createSheetOpen, templateRefreshTrigger } = state;
  
  // Track navigation operations to prevent loops
  const navigationInProgressRef = useRef(false);
  
  // Create a debounced function to update URL
  const updateUrlDebounced = useCallback((newView: 'templates' | 'active') => {
    if (navigationInProgressRef.current) {
      console.log('Navigation already in progress, skipping URL update');
      return;
    }
    
    navigationInProgressRef.current = true;
    console.log(`Updating URL to match view state: ${newView}`);
    
    try {
      // Update URL without causing a full page reload
      const newParams = new URLSearchParams(searchParams);
      newParams.set('view', newView);
      setSearchParams(newParams, { replace: true });
    } catch (error) {
      console.error('Error updating URL params:', error);
    }
    
    // Clear navigation flag after a timeout
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 500);
  }, [searchParams, setSearchParams]);
  
  // Update URL when isTemplateView changes, but only after initial render
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    
    const newView = isTemplateView ? 'templates' : 'active';
    
    // Only update if different from current
    if (viewParam !== newView) {
      updateUrlDebounced(newView);
    }
  }, [isTemplateView, viewParam, updateUrlDebounced]);
  
  // Sync state from URL only when URL changes via browser navigation
  useEffect(() => {
    // Skip during navigation operations to prevent loops
    if (navigationInProgressRef.current) {
      return;
    }
    
    // Skip if we haven't initialized yet
    if (!isInitializedRef.current) {
      return;
    }
    
    console.log('URL parameter changed to:', viewParam);
    
    if (viewParam === 'templates' && !isTemplateView) {
      console.log('URL indicates templates view, updating state');
      setState(prev => ({ ...prev, isTemplateView: true }));
    } else if (viewParam === 'active' && isTemplateView) {
      console.log('URL indicates active plans view, updating state');
      setState(prev => ({ ...prev, isTemplateView: false }));
    } else if (!viewParam) {
      // Set a default if no view param provided
      console.log('No view param detected, defaulting to active view');
      setState(prev => ({ ...prev, isTemplateView: false }));
      
      // Update URL to include the default view
      updateUrlDebounced('active');
    }
  }, [viewParam, isTemplateView, updateUrlDebounced]);
  
  const { createPaymentLink } = usePaymentLinks();
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    console.log('Triggering templates refresh');
    setState(prev => ({ ...prev, templateRefreshTrigger: prev.templateRefreshTrigger + 1 }));
  }, []);
  
  // Enhanced function for handling plan creation with better state control
  const handlePlanCreated = useCallback(() => {
    console.log('Plan created, handling state transitions...');
    
    // First refresh the templates data
    setState(prev => ({ 
      ...prev, 
      templateRefreshTrigger: prev.templateRefreshTrigger + 1,
    }));
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Force navigation with replace:true 
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Update local state
    setState(prev => ({ ...prev, isTemplateView: false, createSheetOpen: false }));
    
    // Reset navigation flag with a delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
      // Show success toast to confirm the action
      toast.success("Payment plan created successfully");
    }, 500);
  }, [navigate]);
  
  const handleCreatePlanClick = useCallback(() => {
    console.log("ManagePlansPage: handleCreatePlanClick");
    setState(prev => ({ ...prev, createSheetOpen: true }));
  }, []);

  const handleViewTemplatesClick = useCallback(() => {
    console.log("ManagePlansPage: handleViewTemplatesClick");
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Navigate with replace:true
    navigate('/dashboard/manage-plans?view=templates', { replace: true });
    
    // Update state to match URL
    setState(prev => ({ ...prev, isTemplateView: true }));
    
    // Reset navigation flag with delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 500);
  }, [navigate]);
  
  const handleBackToPlans = useCallback(() => {
    console.log("ManagePlansPage: handleBackToPlans");
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Navigate with replace:true
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Update state
    setState(prev => ({ ...prev, isTemplateView: false }));
    
    // Reset navigation flag with delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 500);
  }, [navigate]);

  // Log current state for debugging
  console.log('Current view state:', { 
    isTemplateView, 
    viewParam,
    navigationInProgress: navigationInProgressRef.current
  });

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
        onOpenChange={(open) => setState(prev => ({ ...prev, createSheetOpen: open }))}
        createPaymentLink={createPaymentLink}
        onPlanCreated={handlePlanCreated}
        forceActiveView={() => {
          // Safety measure to ensure we go to active view
          navigationInProgressRef.current = true;
          navigate('/dashboard/manage-plans?view=active', { replace: true });
          setState(prev => ({ ...prev, isTemplateView: false }));
          setTimeout(() => {
            navigationInProgressRef.current = false;
          }, 500);
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
