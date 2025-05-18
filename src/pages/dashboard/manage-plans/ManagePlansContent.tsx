
import React from 'react';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import ManagePlansDialogs from './ManagePlansDialogs';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';

const ManagePlansContent: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    plans,
    allPlans,
    isLoading,
    handleViewPlanDetails,
    handleCreatePlanClick,
    showPlanDetails,
    setShowPlanDetails,
    selectedPlan,
    installments,
    activities,
    isLoadingActivities,
    handleSendReminder,
    handleViewPaymentDetails,
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    isPlanPaused,
    openRefundDialog,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentData,
    handleRefund,
  } = useManagePlansContext();

  // Calculate the total number of plans from the unfiltered allPlans array
  const totalPlanCount = allPlans.length;
  
  console.log('ManagePlansContent rendering with showPlanDetails:', showPlanDetails);
  console.log('ManagePlansContent has selectedPlan:', selectedPlan?.id);
  console.log('open refund dialog in managenlans content', openRefundDialog);
  console.log(paymentData)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PaymentPlanFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      
      {/* Plans Table */}
      <ActivePlansTable 
        isLoading={isLoading}
        plans={plans}
        totalPlanCount={totalPlanCount}
        onCreatePlanClick={handleCreatePlanClick}
        onViewPlanDetails={(plan) => {
          console.log('ActivePlansTable onViewPlanDetails called with plan:', plan.id);
          handleViewPlanDetails(plan);
        }}
        statusFilter={statusFilter}
      />

      {/* Plan Details Dialog (Side Drawer) */}
      <PlanDetailsDialog
        showPlanDetails={showPlanDetails}
        setShowPlanDetails={setShowPlanDetails}
        selectedPlan={selectedPlan}
        installments={installments}
        activities={activities}
        isLoadingActivities={isLoadingActivities}
        onSendReminder={handleSendReminder}
        onViewPaymentDetails={handleViewPaymentDetails}
        onCancelPlan={handleOpenCancelDialog}
        onPausePlan={handleOpenPauseDialog}
        onResumePlan={handleOpenResumeDialog}
        onReschedulePlan={handleOpenRescheduleDialog}
        isPlanPaused={isPlanPaused}
        onMarkAsPaid={handleMarkAsPaid}
        onReschedule={handleOpenReschedule}
        onTakePayment={handleTakePayment}
        onOpenRefundDialog={openRefundDialog}
      />

      {/* Payment Refund Dialog */}
      <PaymentRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefund={handleRefund}
        paymentAmount={paymentData?.amount}
        patientName={paymentData?.patientName}
      />
      
      {/* Include the ManagePlansDialogs component here */}
      <ManagePlansDialogs />
    </div>
  );
};

export default ManagePlansContent;
