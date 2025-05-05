
import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, UserRound, Archive, ArrowLeft } from 'lucide-react';
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
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import { Plan } from '@/utils/planTypes';
import { PaymentLink } from '@/types/payment';
import CreatePlanSheet from '@/components/dashboard/payment-plans/CreatePlanSheet';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import ArchivePlanDialog from '@/components/dashboard/payment-plans/ArchivePlanDialog';

// Adapter function to convert Plan objects to PaymentLink format
const convertPlansToPaymentLinks = (plans: Plan[]): PaymentLink[] => {
  return plans.map(plan => ({
    id: plan.id,
    title: plan.title || plan.planName || '',
    description: plan.description || '',
    amount: plan.installmentAmount,
    planTotalAmount: plan.totalAmount,
    paymentCount: plan.totalInstallments,
    paymentCycle: plan.paymentFrequency,
    type: 'payment_plan', // Adding the missing required field
    isRequest: false,
    status: plan.status,
    clinic: {
      id: plan.clinicId,
      name: '', // Default value, not displayed in table
      stripeStatus: ''
    },
    paymentPlan: true
  }));
};

const ManagePlansHeader: React.FC = () => {
  const { handleViewPlansClick, isViewMode, setIsViewMode } = useManagePlansContext();
  const { createPaymentLink } = usePaymentLinks();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  
  const handleCreatePlanClick = () => {
    setCreateSheetOpen(true);
  };
  
  return (
    <>
      <PageHeader 
        title="Payment Plans" 
        description="Create and manage payment plans for your patients"
        action={
          <div className="flex space-x-2">
            {isViewMode ? (
              <Button 
                className="btn-gradient flex items-center"
                onClick={handleCreatePlanClick}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="flex items-center"
                onClick={() => {
                  handleViewPlansClick();
                  setIsViewMode(true);
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Plan Templates
              </Button>
            )}
          </div>
        }
      />

      <CreatePlanSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        createPaymentLink={createPaymentLink}
      />
    </>
  );
};

const ManagePlansPageContent: React.FC = () => {
  const { isViewMode, plans, isLoading, searchQuery, setSearchQuery, handleCreatePlanClick, handleViewPlansClick } = useManagePlansContext();
  
  // For view mode, use the usePaymentPlans hook directly
  const { 
    paymentPlans, 
    filteredPlans: filteredPaymentPlans, 
    isLoading: isPaymentPlansLoading,
    isArchiveView,
    toggleArchiveView,
    handleArchivePlan,
    handleUnarchivePlan,
    fetchPaymentPlans
  } = usePaymentPlans();

  // Refresh payment plans when view mode changes
  useEffect(() => {
    if (isViewMode) {
      console.log('View mode enabled, fetching payment plans');
      fetchPaymentPlans();
    }
  }, [isViewMode, fetchPaymentPlans]);

  // State for archive dialog
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [planToArchive, setPlanToArchive] = useState<PaymentLink | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  
  // Convert Plan[] to PaymentLink[] for the PaymentPlansTable
  const patientPlans = convertPlansToPaymentLinks(plans);

  const onArchivePlan = (plan: PaymentLink) => {
    setPlanToArchive(plan);
    setShowArchiveDialog(true);
  };
  
  const handleBackToActivePlans = () => {
    setIsViewMode(false);
  };

  const confirmArchivePlan = async () => {
    if (!planToArchive) return;
    
    setIsArchiving(true);
    try {
      if (isArchiveView) {
        await handleUnarchivePlan(planToArchive);
      } else {
        await handleArchivePlan(planToArchive);
      }
    } finally {
      setIsArchiving(false);
      setShowArchiveDialog(false);
      setPlanToArchive(null);
    }
  };

  console.log('ManagePlansPageContent render:', {
    isViewMode,
    paymentPlansCount: paymentPlans.length,
    filteredPaymentPlansCount: filteredPaymentPlans.length,
    isPaymentPlansLoading
  });
  
  return (
    <>
      <ManagePlansHeader />
      {isViewMode ? (
        <>
          <PaymentPlansTable
            filteredPlans={filteredPaymentPlans}
            isLoading={isPaymentPlansLoading}
            paymentPlans={paymentPlans}
            onArchivePlan={onArchivePlan}
            onUnarchivePlan={onArchivePlan}
            isArchiveView={isArchiveView}
            toggleArchiveView={toggleArchiveView}
            onBackToActivePlans={handleBackToActivePlans}
            isTemplateView={true}
            onCreatePlanClick={handleCreatePlanClick}
          />
          <ArchivePlanDialog
            open={showArchiveDialog}
            onOpenChange={setShowArchiveDialog}
            onConfirm={confirmArchivePlan}
            plan={planToArchive}
            isLoading={isArchiving}
            isUnarchive={isArchiveView}
          />
        </>
      ) : (
        <ManagePlansContent />
      )}
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
