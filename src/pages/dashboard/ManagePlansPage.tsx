
import React from 'react';
import { PlusCircle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import InstallmentPaymentDialog from '@/components/dashboard/payment-plans/InstallmentPaymentDialog';
import CancelPlanDialog from '@/components/dashboard/payment-plans/CancelPlanDialog';
import PausePlanDialog from '@/components/dashboard/payment-plans/PausePlanDialog';
import ResumePlanDialog from '@/components/dashboard/payment-plans/ResumePlanDialog';
import ReschedulePlanDialog from '@/components/dashboard/payment-plans/ReschedulePlanDialog';
import { useManagePlans } from '@/hooks/useManagePlans';

const ManagePlansPage = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    plans,
    isLoading,
    installments,
    handleViewPlanDetails,
    handleCreatePlanClick,
    handleViewPlansClick,
    handleSendReminder,
    // Payment details properties
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    handleBackToPlans,
    // Cancel plan properties
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    handleOpenCancelDialog,
    // Pause plan properties
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    handleOpenPauseDialog,
    // Resume plan properties
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    handleOpenResumeDialog,
    // Reschedule plan properties
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    handleOpenRescheduleDialog,
    isPlanPaused,
    isProcessing
  } = useManagePlans();

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment Plans" 
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
      
      <div className="space-y-6">
        {/* Filters */}
        <PaymentPlanFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Plans Table */}
        <ActivePlansTable 
          isLoading={isLoading}
          plans={plans}
          onCreatePlanClick={handleCreatePlanClick}
          onViewPlanDetails={handleViewPlanDetails}
        />
      </div>
      
      {/* Plan Details Dialog */}
      <PlanDetailsDialog 
        showPlanDetails={showPlanDetails}
        setShowPlanDetails={setShowPlanDetails}
        selectedPlan={selectedPlan}
        installments={installments}
        onSendReminder={handleSendReminder}
        onViewPaymentDetails={handleViewPaymentDetails}
        onCancelPlan={handleOpenCancelDialog}
        onPausePlan={handleOpenPauseDialog}
        onResumePlan={handleOpenResumeDialog}
        onReschedulePlan={handleOpenRescheduleDialog}
        isPlanPaused={isPlanPaused}
      />

      {/* Payment Details Dialog */}
      <InstallmentPaymentDialog
        showDialog={showPaymentDetails}
        setShowDialog={setShowPaymentDetails}
        paymentData={paymentData}
        onBack={handleBackToPlans}
      />

      {/* Cancel Plan Dialog */}
      <CancelPlanDialog
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        onConfirm={handleCancelPlan}
        planName={selectedPlan?.planName || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      {/* Pause Plan Dialog */}
      <PausePlanDialog
        showDialog={showPauseDialog}
        setShowDialog={setShowPauseDialog}
        onConfirm={handlePausePlan}
        planName={selectedPlan?.planName || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      {/* Resume Plan Dialog */}
      <ResumePlanDialog
        showDialog={showResumeDialog}
        setShowDialog={setShowResumeDialog}
        onConfirm={handleResumePlan}
        planName={selectedPlan?.planName || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      {/* Reschedule Plan Dialog */}
      <ReschedulePlanDialog
        showDialog={showRescheduleDialog}
        setShowDialog={setShowRescheduleDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan?.planName || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
};

export default ManagePlansPage;
