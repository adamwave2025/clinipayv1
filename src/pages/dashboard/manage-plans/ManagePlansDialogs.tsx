
import React from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import CancelPlanDialog from '@/components/dashboard/payment-plans/CancelPlanDialog';
import PausePlanDialog from '@/components/dashboard/payment-plans/PausePlanDialog';
import ResumePlanDialog from '@/components/dashboard/payment-plans/ResumePlanDialog';
import ReschedulePlanDialog from '@/components/dashboard/payment-plans/ReschedulePlanDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';

export const ManagePlansDialogs = () => {
  const {
    selectedPlan,
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    isProcessing,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    processRefund,
    resumeError,
    // Add the mark as paid dialog props
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment,
    // Add the payment reschedule dialog props
    handleReschedulePayment
  } = useManagePlansContext();

  console.log('ManagePlansDialogs rendering with selectedPlan:', selectedPlan?.id);
  console.log('Dialog states:', {
    showCancelDialog,
    showPauseDialog,
    showResumeDialog,
    showRescheduleDialog,
    showMarkAsPaidDialog,
    refundDialogOpen
  });

  if (!selectedPlan) {
    console.log('No selectedPlan, returning null from ManagePlansDialogs');
    return null;
  }

  return (
    <>
      <CancelPlanDialog
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        onConfirm={handleCancelPlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={selectedPlan.patientName || ''}
        isProcessing={isProcessing}
        isLoading={false}
      />
      
      <PausePlanDialog
        showDialog={showPauseDialog}
        setShowDialog={setShowPauseDialog}
        onConfirm={handlePausePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={selectedPlan.patientName || ''}
        isProcessing={isProcessing}
        isLoading={false}
        hasSentPayments={hasSentPayments}
      />
      
      <ResumePlanDialog
        showDialog={showResumeDialog}
        setShowDialog={setShowResumeDialog}
        onConfirm={handleResumePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={selectedPlan.patientName || ''}
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
        hasPaidPayments={hasPaidPayments}
        resumeError={resumeError}
      />
      
      <ReschedulePlanDialog
        showDialog={showRescheduleDialog}
        setShowDialog={setShowRescheduleDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={selectedPlan.patientName || ''}
        startDate={selectedPlan.startDate}
        isProcessing={isProcessing}
        isLoading={false}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
      
      {/* Add Mark as Paid dialog here as a backup */}
      <MarkAsPaidConfirmDialog
        open={showMarkAsPaidDialog}
        onOpenChange={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
        installment={selectedInstallment}
      />
      
      {/* Add Reschedule Payment dialog here as a backup */}
      <ReschedulePaymentDialog
        open={showRescheduleDialog} 
        onOpenChange={setShowRescheduleDialog}
        onConfirm={handleReschedulePayment}
        isLoading={isProcessing}
      />
      
      {paymentToRefund && (
        <PaymentRefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          paymentId={paymentToRefund}
          onRefund={processRefund}
          onConfirm={processRefund}
        />
      )}
    </>
  );
};

export default ManagePlansDialogs;
