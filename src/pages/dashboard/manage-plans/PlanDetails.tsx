
import React, { useEffect } from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanDetailsView from '@/components/dashboard/payment-plans/PlanDetailsView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';

const PlanDetails = () => {
  const {
    selectedPlan,
    installments,
    activities,
    isLoadingActivities,
    isRefreshing,
    handleBackToPlans,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    handleReschedulePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment, // Use the primary selectedInstallment
    isProcessing,
    viewDetailsInstallment, // Using the renamed property here
    handleViewPaymentDetails,
    openRefundDialog,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    handleRefund,
    
    // Add plan operation handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleSendReminder
  } = useManagePlansContext();
  
  // Debug logging for the dialogs
  useEffect(() => {
    console.log('PlanDetails - Dialog states:', { 
      showMarkAsPaidDialog, 
      showReschedulePaymentDialog,
      selectedInstallmentId: selectedInstallment?.id,
      viewDetailsInstallmentId: viewDetailsInstallment?.id
    });
  }, [showMarkAsPaidDialog, showReschedulePaymentDialog, selectedInstallment, viewDetailsInstallment]);
  
  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBackToPlans}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
      </div>
      
      <h2 className="text-2xl font-bold">{selectedPlan.title || selectedPlan.planName}</h2>
      
      <PlanDetailsView
        plan={selectedPlan}
        installments={installments}
        activities={activities}
        onMarkAsPaid={handleMarkAsPaid}
        onReschedule={handleOpenReschedule}
        onTakePayment={handleTakePayment}
        onViewPaymentDetails={handleViewPaymentDetails}
        isLoading={isLoadingActivities}
        isRefreshing={isRefreshing}
        onOpenCancelDialog={handleOpenCancelDialog}
        onOpenPauseDialog={handleOpenPauseDialog}
        onOpenResumeDialog={handleOpenResumeDialog}
        onOpenRescheduleDialog={handleOpenRescheduleDialog}
        onSendReminder={() => selectedPlan && handleSendReminder(selectedPlan.id)}
      />
      
      {paymentData && (
        <PaymentDetailDialog
          payment={paymentData}
          open={showPaymentDetails}
          onOpenChange={setShowPaymentDetails}
          onRefund={openRefundDialog}
        />
      )}
      
      <PaymentRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefund={handleRefund}
        paymentAmount={paymentData?.amount}
        patientName={paymentData?.patientName}
      />
      
      <ReschedulePaymentDialog
        open={showReschedulePaymentDialog}
        onOpenChange={setShowReschedulePaymentDialog}
        onConfirm={handleReschedulePayment}
        isLoading={isProcessing}
      />
      
      <MarkAsPaidConfirmDialog
        open={showMarkAsPaidDialog}
        onOpenChange={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
        installment={selectedInstallment}
      />
    </div>
  );
};

export default PlanDetails;
