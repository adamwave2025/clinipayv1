
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
  
  // Get view param from URL, but don't directly use it for rendering
  const viewParam = searchParams.get('view');
  
  // State is the source of truth, not URL parameters
  const [isTemplateView, setIsTemplateView] = useState(() => {
    // Initialize from URL on first render only
    return viewParam === 'templates';
  });
  
  // Track when we're actively changing views to prevent loops
  const [isChangingView, setIsChangingView] = useState(false);
  const [stableViewRef] = useState({ current: viewParam === 'templates' ? 'templates' : 'active' });
  
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const { createPaymentLink } = usePaymentLinks();
  
  // Add a function to refresh the templates view
  const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
  
  // Update URL when isTemplateView changes, but prevent loops
  useEffect(() => {
    if (isChangingView) return;
    
    const newViewParam = isTemplateView ? 'templates' : 'active';
    
    if (viewParam !== newViewParam) {
      console.log(`Updating URL to match view state: ${newViewParam}`);
      
      // Mark that we're changing view to prevent re-renders from URL changes
      setIsChangingView(true);
      
      // Update URL without causing a full page reload
      const newParams = new URLSearchParams(searchParams);
      newParams.set('view', newViewParam);
      setSearchParams(newParams, { replace: true });
      
      // Store the stable view
      stableViewRef.current = newViewParam;
      
      // Clear changing state after a timeout
      setTimeout(() => {
        setIsChangingView(false);
      }, 300);
    }
  }, [isTemplateView, setSearchParams, searchParams, viewParam, isChangingView, stableViewRef]);
  
  // Sync view state from URL only when URL changes and we're not changing views
  useEffect(() => {
    if (isChangingView) return;
    
    if (viewParam === 'templates' && !isTemplateView) {
      console.log('URL indicates templates view, updating state');
      setIsTemplateView(true);
      stableViewRef.current = 'templates';
    } else if (viewParam === 'active' && isTemplateView) {
      console.log('URL indicates active plans view, updating state');
      setIsTemplateView(false);
      stableViewRef.current = 'active';
    } else if (!viewParam) {
      // Set a default if no view param provided
      console.log('No view param detected, defaulting to active view');
      setIsTemplateView(false);
      
      // Update URL to include the default view
      const newParams = new URLSearchParams(searchParams);
      newParams.set('view', 'active');
      setSearchParams(newParams, { replace: true });
      
      stableViewRef.current = 'active';
    }
  }, [viewParam, isTemplateView, searchParams, setSearchParams, isChangingView, stableViewRef]);
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    console.log('Triggering templates refresh');
    setTemplateRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Enhanced function for handling plan creation with better state control and forced navigation
  const handlePlanCreated = useCallback(() => {
    console.log('Plan created, handling state transitions...');
    
    // First refresh the templates data to keep templates up to date
    setTemplateRefreshTrigger(prev => prev + 1);
    
    // Set changing state to prevent loops
    setIsChangingView(true);
    
    // Force navigation with replace:true to ensure we reset navigation history
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Set local state to match with slightly increased delay to ensure navigation completes first
    setTimeout(() => {
      console.log('Setting isTemplateView to false after navigation');
      setIsTemplateView(false);
      stableViewRef.current = 'active';
      
      // Clear changing state
      setIsChangingView(false);
      
      // Show success toast to confirm the action
      toast.success("Payment plan created successfully");
    }, 300); // Increased delay for more reliable state transition
  }, [navigate, stableViewRef]);
  
  const handleCreatePlanClick = useCallback(() => {
    console.log("ManagePlansPage: handleCreatePlanClick");
    setCreateSheetOpen(true);
  }, []);

  const handleViewTemplatesClick = useCallback(() => {
    console.log("ManagePlansPage: handleViewTemplatesClick");
    
    // Set changing state to prevent loops
    setIsChangingView(true);
    
    // We're using replace:true to ensure clean navigation history
    navigate('/dashboard/manage-plans?view=templates', { replace: true });
    
    // Update state to match URL
    setIsTemplateView(true);
    stableViewRef.current = 'templates';
    
    // Clear changing state after delay
    setTimeout(() => {
      setIsChangingView(false);
    }, 300);
  }, [navigate, stableViewRef]);
  
  const handleBackToPlans = useCallback(() => {
    console.log("ManagePlansPage: handleBackToPlans");
    
    // Set changing state to prevent loops
    setIsChangingView(true);
    
    // We're using replace:true to ensure clean navigation history
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Force reset isTemplateView to prevent race conditions
    setIsTemplateView(false);
    stableViewRef.current = 'active';
    
    // Clear changing state after delay
    setTimeout(() => {
      setIsChangingView(false);
    }, 300);
  }, [navigate, stableViewRef]);

  // Log current state for debugging
  console.log('Current view state:', { 
    isTemplateView, 
    viewParam, 
    stableView: stableViewRef.current,
    isChangingView
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
        onOpenChange={setCreateSheetOpen}
        createPaymentLink={createPaymentLink}
        onPlanCreated={handlePlanCreated}
        forceActiveView={() => {
          // Extra safety measure to ensure we go to active view
          setIsChangingView(true);
          navigate('/dashboard/manage-plans?view=active', { replace: true });
          setIsTemplateView(false);
          stableViewRef.current = 'active';
          setTimeout(() => {
            setIsChangingView(false);
          }, 300);
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
