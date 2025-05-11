
import React, { useEffect } from 'react';
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
    
    // Add the take payment dialog props
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated
  } = useManagePlansContext();

  // Detailed debugging to track state and data flow
  console.log('ManagePlansDialogs rendering with selectedPlan:', selectedPlan?.id);
  console.log('Dialog states:', {
    showCancelDialog,
    showPauseDialog,
    showResumeDialog,
    showReschedulePlanDialog,
    showReschedulePaymentDialog,
    showMarkAsPaidDialog,
    showTakePaymentDialog,
    refundDialogOpen
  });
  
  console.log('Selected installment data:', selectedInstallment);
  
  // Enhanced debug for selected installment when take payment dialog should show
  useEffect(() => {
    if (showTakePaymentDialog) {
      console.log('TakePaymentDialog should show with selectedInstallment:', selectedInstallment);
      
      if (!selectedInstallment) {
        console.error('Missing selectedInstallment data in ManagePlansDialogs');
        toast.error("Cannot show payment dialog: Missing installment data");
        // Auto-close the dialog if we don't have data to prevent errors
        setShowTakePaymentDialog(false);
      }
    }
  }, [showTakePaymentDialog, selectedInstallment, setShowTakePaymentDialog]);

  // Early return if no plan is selected
  if (!selectedPlan) {
    console.log('No selectedPlan, returning null from ManagePlansDialogs');
    return null;
  }

  // Prepare patient information from the selected plan
  const patientName = selectedPlan.patientName || '';
  const patientEmail = selectedPlan.patientEmail || ''; 

  // IMPROVED: More comprehensive validation for installment data
  const canShowPaymentDialog = Boolean(
    selectedInstallment && 
    typeof selectedInstallment === 'object' &&
    selectedInstallment.id &&
    selectedInstallment.amount &&
    showTakePaymentDialog
  );
  
  // Error handling function that returns null instead of void
  const renderMissingInstallmentHandler = () => {
    if (showTakePaymentDialog && !canShowPaymentDialog) {
      // Log the error
      console.error("Cannot show payment dialog: Invalid installment data", selectedInstallment);
      
      // Show toast
      toast.error("Cannot show payment dialog: Invalid installment data");
      
      // Close the dialog
      setShowTakePaymentDialog(false);
      
      // Return null since we're in a function
      return null;
    }
    
    return null;
  };

  return (
    <>
      <CancelPlanDialog
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        onConfirm={handleCancelPlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={patientName}
        isProcessing={isProcessing}
        isLoading={false}
      />
      
      <PausePlanDialog
        showDialog={showPauseDialog}
        setShowDialog={setShowPauseDialog}
        onConfirm={handlePausePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={patientName}
        isProcessing={isProcessing}
        isLoading={false}
        hasSentPayments={hasSentPayments}
      />
      
      <ResumePlanDialog
        showDialog={showResumeDialog}
        setShowDialog={setShowResumeDialog}
        onConfirm={handleResumePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={patientName}
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
        hasPaidPayments={hasPaidPayments}
        resumeError={resumeError}
      />
      
      {/* Dialog for rescheduling an entire plan */}
      <ReschedulePlanDialog
        showDialog={showReschedulePlanDialog}
        setShowDialog={setShowReschedulePlanDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan.title || selectedPlan.planName || ''}
        patientName={patientName}
        startDate={selectedPlan.startDate}
        isProcessing={isProcessing}
        isLoading={false}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
      
      {/* Dialog for rescheduling an individual payment - with extra debugging log */}
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
      
      {/* Add Mark as Paid dialog here */}
      <MarkAsPaidConfirmDialog
        open={showMarkAsPaidDialog}
        onOpenChange={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
        installment={selectedInstallment}
      />

      {/* IMPROVED: More robust conditional rendering for TakePaymentDialog */}
      {canShowPaymentDialog && (
        <TakePaymentDialog
          key={`payment-dialog-${selectedInstallment?.id}`} // Force re-render on installment change
          open={showTakePaymentDialog}
          onOpenChange={(open) => {
            console.log(`Setting take payment dialog to ${open ? 'open' : 'closed'}`);
            if (!open) {
              toast.info("Closing payment dialog");
            }
            setShowTakePaymentDialog(open);
          }}
          paymentId={selectedInstallment?.id}
          patientName={patientName}
          patientEmail={patientEmail}
          amount={selectedInstallment?.amount}
          onPaymentProcessed={onPaymentUpdated}
        />
      )}
      
      {/* Handle missing installment data with our helper function */}
      {renderMissingInstallmentHandler()}
      
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
