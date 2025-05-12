
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
    
    // Add the take payment dialog props
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated
  } = useManagePlansContext();

  // Enhanced caching: Store the last valid installment
  const [cachedInstallment, setCachedInstallment] = useState<PlanInstallment | null>(null);

  // Track payment dialog rendering to debug issues
  const [paymentDialogRenderCount, setPaymentDialogRenderCount] = useState(0);
  
  // Memoized valid installment, combining current or cached data
  const validInstallment = useMemo(() => {
    // Get either the current installment or the cached one
    const installmentToUse = selectedInstallment || cachedInstallment;
    
    // Debug the source of our installment data
    console.log("Current installment source:", selectedInstallment ? "selectedInstallment" : 
      (cachedInstallment ? "cachedInstallment" : "none"));
    
    // If we have an installment, validate it has the required data
    if (installmentToUse && 
        typeof installmentToUse === 'object' && 
        installmentToUse.id && 
        installmentToUse.amount) {
      // Create a complete deep clone with all necessary properties
      try {
        // Create a complete clone with fallback values for any missing properties
        const safeInstallment = JSON.parse(JSON.stringify({
          ...installmentToUse,
          id: installmentToUse.id,
          amount: installmentToUse.amount,
          paymentNumber: installmentToUse.paymentNumber || 1,
          totalPayments: installmentToUse.totalPayments || 1,
          dueDate: installmentToUse.dueDate || new Date().toISOString(),
          status: installmentToUse.status || 'pending'
        }));
        
        console.log("ManagePlansDialogs: Valid installment created:", safeInstallment);
        return safeInstallment;
      } catch (err) {
        console.error("Failed to create safe installment:", err);
        return null;
      }
    }
    
    console.log("ManagePlansDialogs: No valid installment available");
    return null;
  }, [selectedInstallment, cachedInstallment]);
  
  // Update cached installment whenever we get a valid selectedInstallment
  useEffect(() => {
    if (selectedInstallment && typeof selectedInstallment === 'object' && 
        selectedInstallment.id && selectedInstallment.amount) {
      console.log('Caching valid installment data:', selectedInstallment);
      setCachedInstallment(selectedInstallment);
    }
  }, [selectedInstallment]);
  
  // Monitor the take payment dialog flag and valid installment
  useEffect(() => {
    if (showTakePaymentDialog) {
      console.log(`TakePaymentDialog should show (render #${paymentDialogRenderCount + 1})`);
      console.log('Selected installment:', selectedInstallment);
      console.log('Cached installment:', cachedInstallment);
      console.log('Valid installment for dialog:', validInstallment);
      
      // Increment render tracking
      setPaymentDialogRenderCount(prev => prev + 1);
      
      if (!validInstallment) {
        console.error("Cannot show payment dialog: No valid installment data available");
        toast.error("Cannot show payment dialog: Missing payment data");
        // Close the dialog if we don't have data to prevent errors
        setShowTakePaymentDialog(false);
      }
    }
  }, [showTakePaymentDialog, validInstallment, selectedInstallment, cachedInstallment]);

  // Early return if no plan is selected
  if (!selectedPlan) {
    console.log('No selectedPlan, returning null from ManagePlansDialogs');
    return null;
  }

  // Prepare patient information from the selected plan
  const patientName = selectedPlan.patientName || '';
  const patientEmail = selectedPlan.patientEmail || ''; 

  // Comprehensive check if we can show the payment dialog
  const canShowPaymentDialog = showTakePaymentDialog && validInstallment !== null;

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

      {/* Improved payment dialog rendering with clear conditions */}
      {canShowPaymentDialog && validInstallment && (
        <TakePaymentDialog
          key={`payment-dialog-${validInstallment.id}-${paymentDialogRenderCount}`}
          open={showTakePaymentDialog}
          onOpenChange={(open) => {
            console.log(`Setting take payment dialog to ${open ? 'open' : 'closed'}`);
            if (!open) {
              toast.info("Closing payment dialog");
            }
            setShowTakePaymentDialog(open);
          }}
          paymentId={validInstallment.id}
          patientName={patientName}
          patientEmail={patientEmail}
          amount={validInstallment.amount}
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
