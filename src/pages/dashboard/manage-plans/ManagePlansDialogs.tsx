
import React from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import PlanActionDialogs from '@/components/dashboard/payment-plans/PlanActionDialogs';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import TakePaymentDialog from '@/components/dashboard/payment-plans/TakePaymentDialog';

const ManagePlansDialogs = () => {
  const {
    // Plan operation dialogs
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    
    // Payment operation dialogs
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    handleReschedulePayment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated,
    paymentDialogData,
    
    // State and shared data
    selectedPlan,
    selectedInstallment,
    isProcessing,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments
  } = useManagePlansContext();

  return (
    <>
      {/* Plan action dialogs */}
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
        hasPaidPayments={hasPaidPayments}
      />
      
      {/* Payment detail dialog */}
      {paymentData && (
        <PaymentDetailDialog
          payment={paymentData}
          open={showPaymentDetails}
          onOpenChange={setShowPaymentDetails}
          onRefund={() => {}}
        />
      )}
      
      {/* Mark as paid confirmation dialog */}
      <MarkAsPaidConfirmDialog
        open={showMarkAsPaidDialog}
        onOpenChange={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
        installment={selectedInstallment}
      />
      
      {/* Reschedule payment dialog */}
      <ReschedulePaymentDialog
        open={showReschedulePaymentDialog}
        onOpenChange={setShowReschedulePaymentDialog}
        onConfirm={handleReschedulePayment}
        isLoading={isProcessing}
      />
      
      {/* Take payment dialog */}
      {paymentDialogData && (
        <TakePaymentDialog
          open={showTakePaymentDialog}
          onOpenChange={setShowTakePaymentDialog}
          onPaymentProcessed={onPaymentUpdated}
          paymentId={paymentDialogData.paymentId}
          amount={paymentDialogData.amount}
          patientName={paymentDialogData.patientName}
          patientEmail={paymentDialogData.patientEmail}
          patientPhone={paymentDialogData.patientPhone}
        />
      )}
    </>
  );
};

export default ManagePlansDialogs;
