
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

// Define a type for the direct payment data used by the payment dialog
interface PaymentDialogData {
  paymentId: string;
  patientName: string;
  patientEmail: string;
  amount: number;
  isValid: boolean;
}

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
    onPaymentUpdated
  } = useManagePlansContext();

  // Track payment dialog rendering to debug issues
  const [paymentDialogRenderCount, setPaymentDialogRenderCount] = useState(0);
  
  // Create a direct payment data object that won't be affected by context state issues
  const [directPaymentData, setDirectPaymentData] = useState<PaymentDialogData>({
    paymentId: '',
    patientName: '',
    patientEmail: '',
    amount: 0,
    isValid: false
  });
  
  // Update direct payment data whenever selectedInstallment or paymentData changes
  useEffect(() => {
    // For debugging
    console.log("Selected installment updated:", selectedInstallment);
    console.log("Payment data updated:", paymentData);
    
    const installmentToUse = paymentData || selectedInstallment;
    
    if (installmentToUse && 
        typeof installmentToUse === 'object' && 
        installmentToUse.id && 
        typeof installmentToUse.amount === 'number') {
      
      // Create the direct payment data
      const newPaymentData: PaymentDialogData = {
        paymentId: installmentToUse.id,
        patientName: selectedPlan?.patientName || '',
        patientEmail: selectedPlan?.patientEmail || '',
        amount: installmentToUse.amount,
        isValid: true
      };
      
      console.log("Setting direct payment data:", newPaymentData);
      setDirectPaymentData(newPaymentData);
    }
  }, [selectedInstallment, paymentData, selectedPlan]);
  
  // Monitor the take payment dialog to react to it opening
  useEffect(() => {
    if (showTakePaymentDialog) {
      console.log(`TakePaymentDialog should show (render #${paymentDialogRenderCount + 1})`);
      console.log('Direct payment data:', directPaymentData);
      
      // Increment render tracking
      setPaymentDialogRenderCount(prev => prev + 1);
      
      if (!directPaymentData.isValid) {
        console.error("Cannot show payment dialog: No valid payment data available");
        toast.error("Cannot show payment dialog: Missing payment data");
        // Close the dialog if we don't have data to prevent errors
        setShowTakePaymentDialog(false);
      }
    }
  }, [showTakePaymentDialog, directPaymentData, paymentDialogRenderCount]);

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
        hasPaidPayments={hasPaidPayments}
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

      {/* Improved payment dialog rendering with direct data */}
      {showTakePaymentDialog && directPaymentData.isValid && (
        <TakePaymentDialog
          key={`payment-dialog-${directPaymentData.paymentId}-${paymentDialogRenderCount}`}
          open={showTakePaymentDialog}
          onOpenChange={(open) => {
            console.log(`Setting take payment dialog to ${open ? 'open' : 'closed'}`);
            setShowTakePaymentDialog(open);
          }}
          paymentId={directPaymentData.paymentId}
          patientName={directPaymentData.patientName}
          patientEmail={directPaymentData.patientEmail}
          amount={directPaymentData.amount}
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
