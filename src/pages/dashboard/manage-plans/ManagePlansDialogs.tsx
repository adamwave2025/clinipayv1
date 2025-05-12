
import React, { useEffect, useState, useMemo } from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import CancelPlanDialog from '@/components/dashboard/payment-plans/CancelPlanDialog';
import PausePlanDialog from '@/components/dashboard/payment-plans/PausePlanDialog';
import ResumePlanDialog from '@/components/dashboard/payment-plans/ResumePlanDialog';
import ReschedulePlanDialog from '@/components/dashboard/payment-plans/ReschedulePlanDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import TakePaymentDialog from '@/components/dashboard/payment-plans/TakePaymentDialog';
import { toast } from '@/hooks/use-toast';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

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
    
    // Plan rescheduling (entire plan)
    showRescheduleDialog: showReschedulePlanDialog,
    setShowRescheduleDialog: setShowReschedulePlanDialog,
    handleReschedulePlan,
    
    // Payment rescheduling (individual payment)
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    handleReschedulePayment,
    
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
    paymentData,
    
    // Add the take payment dialog props
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated,
    
    // Add the dedicated payment dialog data
    paymentDialogData
  } = useManagePlansContext();

  // Track payment dialog rendering to debug issues
  const [paymentDialogRenderCount, setPaymentDialogRenderCount] = useState(0);
  
  // Monitor the take payment dialog to react to it opening
  useEffect(() => {
    if (showTakePaymentDialog) {
      console.log(`TakePaymentDialog should show (render #${paymentDialogRenderCount + 1})`);
      
      // Increment render tracking
      setPaymentDialogRenderCount(prev => prev + 1);
      
      // Validate payment data is available
      if (!paymentDialogData?.isValid) {
        console.error("Cannot show payment dialog: No valid payment dialog data available");
        toast.error("Cannot show payment dialog: Missing payment data");
        // Close the dialog if we don't have data to prevent errors
        setShowTakePaymentDialog(false);
      }
    }
  }, [showTakePaymentDialog, paymentDialogData, paymentDialogRenderCount, setShowTakePaymentDialog]);

  // Early return if no plan is selected
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
        hasPaidPayments={hasPaidPayments} // Add this prop
        resumeError={resumeError}
      />
      
      {/* Dialog for rescheduling an entire plan */}
      <ReschedulePlanDialog
        showDialog={showReschedulePlanDialog}
        setShowDialog={setShowReschedulePlanDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={selectedPlan.patientName || ''}
        startDate={selectedPlan.startDate}
        isProcessing={isProcessing}
        isLoading={false}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
      
      {/* Dialog for rescheduling an individual payment */}
      <ReschedulePaymentDialog
        open={showReschedulePaymentDialog} 
        onOpenChange={(open) => {
          console.log(`Setting reschedule payment dialog to ${open ? 'open' : 'closed'}`);
          setShowReschedulePaymentDialog(open);
        }}
        onConfirm={(date) => {
          console.log(`Confirming reschedule payment with date: ${date.toISOString()}`);
          handleReschedulePayment(date);
        }}
        isLoading={isProcessing}
      />
      
      {/* Mark as Paid dialog */}
      <MarkAsPaidConfirmDialog
        open={showMarkAsPaidDialog}
        onOpenChange={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
        installment={selectedInstallment}
      />

      {/* Improved payment dialog rendering with dedicated payment dialog data */}
      {showTakePaymentDialog && paymentDialogData?.isValid && (
        <TakePaymentDialog
          key={`payment-dialog-${paymentDialogData.paymentId}-${paymentDialogRenderCount}`}
          open={showTakePaymentDialog}
          onOpenChange={(open) => {
            console.log(`Setting take payment dialog to ${open ? 'open' : 'closed'}`);
            setShowTakePaymentDialog(open);
          }}
          paymentId={paymentDialogData.paymentId}
          patientName={paymentDialogData.patientName}
          patientEmail={paymentDialogData.patientEmail}
          patientPhone={paymentDialogData.patientPhone}
          amount={paymentDialogData.amount}
          onPaymentProcessed={onPaymentUpdated}
        />
      )}
      
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
