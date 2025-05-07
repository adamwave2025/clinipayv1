
import React from 'react';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import InstallmentPaymentDialog from '@/components/dashboard/payment-plans/InstallmentPaymentDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import PlanActionDialogs from '@/components/dashboard/payment-plans/PlanActionDialogs';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';

const ManagePlansDialogs: React.FC = () => {
  const {
    // Plan details dialog
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
    isPlanPaused,
    
    // Payment details dialog
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleBackToPlans,
    openRefundDialog,
    
    // Refund dialog
    refundDialogOpen,
    setRefundDialogOpen,
    processRefund,
    
    // Cancel, pause, resume, reschedule plan dialog states
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    showRescheduleDialog,
    setShowRescheduleDialog,
    
    // Plan operation handlers
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    
    isProcessing,
    hasSentPayments,
    hasOverduePayments
  } = useManagePlansContext();

  return (
    <>
      {/* Plan Details Dialog */}
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
      />

      {/* Payment Details Dialog */}
      <InstallmentPaymentDialog
        showDialog={showPaymentDetails}
        setShowDialog={setShowPaymentDetails}
        paymentData={paymentData}
        onBack={handleBackToPlans}
        onRefund={openRefundDialog}
      />

      {/* Payment Refund Dialog */}
      <PaymentRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onConfirm={processRefund}
        paymentAmount={paymentData?.amount || 0}
        patientName={paymentData?.patientName || ''}
      />

      {/* Use the shared PlanActionDialogs component */}
      <PlanActionDialogs
        showCancelDialog={showCancelDialog}
        setShowCancelDialog={setShowCancelDialog}
        showPauseDialog={showPauseDialog}
        setShowPauseDialog={setShowPauseDialog}
        showResumeDialog={showResumeDialog}
        setShowResumeDialog={setShowResumeDialog}
        showRescheduleDialog={showRescheduleDialog}
        setShowRescheduleDialog={setShowRescheduleDialog}
        selectedPlan={selectedPlan}
        handleCancelPlan={handleCancelPlan}
        handlePausePlan={handlePausePlan}
        handleResumePlan={handleResumePlan}
        handleReschedulePlan={handleReschedulePlan}
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
    </>
  );
};

export default ManagePlansDialogs;
