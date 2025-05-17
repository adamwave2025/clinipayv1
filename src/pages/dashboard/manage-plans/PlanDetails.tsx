
import React, { useEffect } from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanDetailsView from '@/components/dashboard/payment-plans/PlanDetailsView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';

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
    refreshPlanState, // Use the refreshPlanState function
    
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
  
  // Add effect to refresh plan data when coming back to this screen or after actions
  useEffect(() => {
    if (selectedPlan?.id) {
      console.log('PlanDetails - Refreshing plan state for ID:', selectedPlan.id);
      refreshPlanState(selectedPlan.id);
    }
  }, [selectedPlan?.id]);
  
  if (!selectedPlan) {
    return null;
  }

  // Wrapper functions to ensure plan data is refreshed after actions
  const handleAfterMarkAsPaid = (id: string, installment: any) => {
    handleMarkAsPaid(id);
  };
  
  const handleAfterReschedule = (id: string) => {
    handleOpenReschedule(id);
  };
  
  const handleAfterPayment = (id: string, installment: any) => {
    handleTakePayment(id, installment);
  };

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
        onMarkAsPaid={handleAfterMarkAsPaid}
        onReschedule={handleAfterReschedule}
        onTakePayment={handleAfterPayment}
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
          onRefund={() => {}}
        />
      )}
      
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
