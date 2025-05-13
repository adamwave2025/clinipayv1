
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
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  // Get view param from URL
  const viewParam = searchParams.get('view');
  
  // Use a ref to track initialization
  const isInitializedRef = useRef(false);
  
  // Track URL history to prevent loops
  const urlHistoryRef = useRef<{path: string, params: string, timestamp: number}[]>([]);
  const MAX_HISTORY_SIZE = 5;
  
  // Track navigation operations to prevent loops
  const navigationInProgressRef = useRef(false);
  
  // Detect potential loops
  const isNavigationLoopDetected = useRef(false);
  
  // State is the source of truth, not URL parameters
  const [state, setState] = useState<ManagePlansPageState>(() => ({
    // Initialize from URL on first render only
    isTemplateView: viewParam === 'templates',
    createSheetOpen: false,
    templateRefreshTrigger: 0,
  }));
  
  // Destructure state for readability
  const { isTemplateView, createSheetOpen, templateRefreshTrigger } = state;
  
  // Add URL history entry to detect loops
  useEffect(() => {
    const currentParams = searchParams.toString();
    const currentPath = location.pathname;
    const now = Date.now();
    
    const historyEntry = {
      path: currentPath,
      params: currentParams,
      timestamp: now
    };
    
    // Add to history
    urlHistoryRef.current = [historyEntry, ...urlHistoryRef.current.slice(0, MAX_HISTORY_SIZE - 1)];
    
    // Check for loop detection - 3+ identical navigation actions in quick succession
    const history = urlHistoryRef.current;
    if (history.length >= 3) {
      const identical = history.slice(0, 3).every(entry => 
        entry.path === currentPath && entry.params === currentParams
      );
      
      const timeSpan = history[0].timestamp - history[2].timestamp;
      
      // If 3 identical URLs within 2 seconds, it's probably a loop
      if (identical && timeSpan < 2000) {
        isNavigationLoopDetected.current = true;
        console.warn('Navigation loop detected in ManagePlansPage! Stopping URL updates.');
      }
    }
  }, [location.pathname, searchParams]);
  
  // Only update URL when isTemplateView changes, but only after initial render
  // and only if no loop is detected
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    
    // Skip URL updates if we detect a navigation loop
    if (isNavigationLoopDetected.current) {
      console.warn('Skipping URL update due to detected navigation loop');
      return;
    }
    
    // Skip if navigation is already in progress
    if (navigationInProgressRef.current) {
      return;
    }
    
    const newView = isTemplateView ? 'templates' : 'active';
    
    // Only update if different from current - use simple equality here to avoid triggering loops
    if (viewParam !== newView) {
      try {
        navigationInProgressRef.current = true;
        
        // Update URL without causing a full page reload
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', newView);
        setSearchParams(newParams, { replace: true });
        
        console.log(`URL updated to match view state: ${newView}`);
      } catch (error) {
        console.error('Error updating URL params:', error);
      } finally {
        // Reset navigation flag with delay
        setTimeout(() => {
          navigationInProgressRef.current = false;
        }, 300);
      }
    }
  }, [isTemplateView, viewParam, setSearchParams, searchParams]);
  
  // Sync state from URL only when URL changes via browser navigation
  // and only if we're NOT in a detected loop
  useEffect(() => {
    // Skip during navigation operations to prevent loops
    if (navigationInProgressRef.current) {
      return;
    }
    
    // Skip if we haven't initialized yet
    if (!isInitializedRef.current) {
      return;
    }
    
    // Skip if loop detected
    if (isNavigationLoopDetected.current) {
      return;
    }
    
    if (viewParam === 'templates' && !isTemplateView) {
      setState(prev => ({ ...prev, isTemplateView: true }));
    } else if (viewParam === 'active' && isTemplateView) {
      setState(prev => ({ ...prev, isTemplateView: false }));
    } else if (!viewParam) {
      // Set a default if no view param provided
      setState(prev => ({ ...prev, isTemplateView: false }));
      
      // Only update URL if there's no loop
      if (!isNavigationLoopDetected.current) {
        navigationInProgressRef.current = true;
        
        // Update URL with the default view - use replace to avoid history buildup
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', 'active');
        setSearchParams(newParams, { replace: true });
        
        // Reset navigation flag with delay
        setTimeout(() => {
          navigationInProgressRef.current = false;
        }, 300);
      }
    }
  }, [viewParam, isTemplateView, searchParams, setSearchParams]);
  
  const { createPaymentLink } = usePaymentLinks();
  
  // Create a callback function to trigger template refresh
  const refreshTemplates = useCallback(() => {
    setState(prev => ({ ...prev, templateRefreshTrigger: prev.templateRefreshTrigger + 1 }));
  }, []);
  
  // Enhanced function for handling plan creation with better state control
  const handlePlanCreated = useCallback(() => {
    // First refresh the templates data
    setState(prev => ({ 
      ...prev, 
      templateRefreshTrigger: prev.templateRefreshTrigger + 1,
      createSheetOpen: false,  // Close sheet immediately
      isTemplateView: false    // Switch to active view
    }));
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Force navigation with replace:true 
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Reset navigation flag with a delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
      // Show success toast to confirm the action
      toast.success("Payment plan created successfully");
    }, 500);
  }, [navigate]);
  
  const handleCreatePlanClick = useCallback(() => {
    setState(prev => ({ ...prev, createSheetOpen: true }));
  }, []);

  const handleViewTemplatesClick = useCallback(() => {
    // Skip state updates if we're in a loop
    if (isNavigationLoopDetected.current) {
      console.warn('Skipping template view navigation due to detected loop');
      return;
    }
    
    // Set state first, then update URL
    setState(prev => ({ ...prev, isTemplateView: true }));
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Navigate with replace:true
    navigate('/dashboard/manage-plans?view=templates', { replace: true });
    
    // Reset navigation flag with delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 300);
  }, [navigate]);
  
  const handleBackToPlans = useCallback(() => {
    // Skip state updates if we're in a loop
    if (isNavigationLoopDetected.current) {
      console.warn('Skipping back to plans navigation due to detected loop');
      return;
    }
    
    // Set state first, then update URL
    setState(prev => ({ ...prev, isTemplateView: false }));
    
    // Set navigation flag to prevent loops
    navigationInProgressRef.current = true;
    
    // Navigate with replace:true
    navigate('/dashboard/manage-plans?view=active', { replace: true });
    
    // Reset navigation flag with delay
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 300);
  }, [navigate]);
  
  // Reset loop detection on unmount or major state changes
  useEffect(() => {
    return () => {
      isNavigationLoopDetected.current = false;
    };
  }, []);

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
          setState(prev => ({ ...prev, isTemplateView: false }));
          
          navigationInProgressRef.current = true;
          navigate('/dashboard/manage-plans?view=active', { replace: true });
          
          setTimeout(() => {
            navigationInProgressRef.current = false;
          }, 300);
        }}
      />
      
      <Toaster />
    </>
  );
};

// Render a ManagePlansProvider that wraps the content
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
