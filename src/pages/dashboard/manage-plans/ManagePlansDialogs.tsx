
import React from 'react';
import PlanDetailsDialog from '@/components/dashboard/payment-plans/PlanDetailsDialog';
import InstallmentPaymentDialog from '@/components/dashboard/payment-plans/InstallmentPaymentDialog';
import CancelPlanDialog from '@/components/dashboard/payment-plans/CancelPlanDialog';
import PausePlanDialog from '@/components/dashboard/payment-plans/PausePlanDialog';
import ResumePlanDialog from '@/components/dashboard/payment-plans/ResumePlanDialog';
import ReschedulePlanDialog from '@/components/dashboard/payment-plans/ReschedulePlanDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
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
    
    // Cancel plan dialog
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    
    // Pause plan dialog
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    
    // Resume plan dialog
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    
    // Reschedule plan dialog
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    
    isProcessing
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
    </>
  );
};

export default ManagePlansDialogs;
