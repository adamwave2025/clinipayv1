
import React, { useEffect, useState } from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanDetailsView from '@/components/dashboard/payment-plans/PlanDetailsView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import { PaymentRefundService } from '@/services/PaymentRefundService';
import { useRefundState } from '@/hooks/payment-plans/useRefundState';
import { usePaymentDetailsFetcher } from '@/hooks/payment-plans/usePaymentDetailsFetcher';

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
    selectedInstallment,
    isProcessing,
    viewDetailsInstallment,
    refreshPlanState,
    
    // Add plan operation handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleSendReminder
  } = useManagePlansContext();
  
  // Create a local state to handle the payment detail dialog
  const [viewInstallment, setViewInstallment] = useState<PlanInstallment | null>(null);
  const [showLocalPaymentDetails, setShowLocalPaymentDetails] = useState(false);
  
  // Use payment details fetcher to load data from DB
  const { fetchPaymentDetails, paymentData: localPaymentData, setPaymentData: setLocalPaymentData } = usePaymentDetailsFetcher();
  
  // Use refund state for handling refunds
  const { 
    refundDialogOpen, 
    setRefundDialogOpen, 
    paymentToRefund, 
    setPaymentToRefund,
    processRefund: handleRefundAmount
  } = useRefundState();
  
  // Track local processing state
  const [isRefundProcessing, setIsRefundProcessing] = useState(false);
  
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

  // Function to handle viewing details of an installment
  const handleViewInstallmentDetails = async (installment: PlanInstallment) => {
    console.log('Viewing details for installment:', installment);
    setViewInstallment(installment);
    
    // Fetch complete payment data from the database for this installment
    // This will handle both paid and unpaid installments appropriately
    const paymentData = await fetchPaymentDetails(installment);
    setShowLocalPaymentDetails(true);
  };
  
  // Handler for initiating a refund
  const handleRefundPayment = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };
  
  // Process the refund with the provided amount
  const processRefund = async (amount?: number, paymentId?: string) => {
    if (!paymentId) {
      console.error("No payment ID provided for refund");
      return;
    }
    
    setIsRefundProcessing(true);
    
    try {
      console.log(`Processing refund of amount ${amount} for payment ${paymentId}`);
      
      const result = await PaymentRefundService.processRefund(paymentId, amount);
      
      if (result.success) {
        toast.success("Refund processed successfully");
        
        // Close the refund dialog
        setRefundDialogOpen(false);
        
        // Refresh the plan data to show updated payment status
        if (selectedPlan) {
          await refreshPlanState(selectedPlan.id);
        }
        
        // If this was for the local payment dialog, refresh its data
        if (localPaymentData && localPaymentData.id === paymentId) {
          const updatedPayment = await fetchPaymentDetails(viewInstallment!);
        }
        
        // If this was for the context payment dialog
        if (paymentData && paymentData.id === paymentId) {
          // Refresh the payment data in the context
          if (viewDetailsInstallment) {
            await fetchPaymentDetails(viewDetailsInstallment);
          }
        }
      } else {
        toast.error(`Refund failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('An error occurred while processing the refund');
    } finally {
      setIsRefundProcessing(false);
    }
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
        onMarkAsPaid={handleMarkAsPaid}
        onReschedule={handleOpenReschedule}
        onTakePayment={handleTakePayment}
        onViewDetails={handleViewInstallmentDetails}
        isLoading={isLoadingActivities}
        isRefreshing={isRefreshing}
        onOpenCancelDialog={handleOpenCancelDialog}
        onOpenPauseDialog={handleOpenPauseDialog}
        onOpenResumeDialog={handleOpenResumeDialog}
        onOpenRescheduleDialog={handleOpenRescheduleDialog}
        onSendReminder={() => selectedPlan && handleSendReminder(selectedPlan.id)}
      />
      
      {/* Use context-provided payment dialog for existing flows */}
      {paymentData && (
        <PaymentDetailDialog
          payment={paymentData}
          open={showPaymentDetails}
          onOpenChange={setShowPaymentDetails}
          onRefund={() => handleRefundPayment(paymentData.id)}
        />
      )}
      
      {/* Use local payment dialog for installment clicks */}
      {localPaymentData && (
        <PaymentDetailDialog
          payment={localPaymentData}
          open={showLocalPaymentDetails}
          onOpenChange={setShowLocalPaymentDetails}
          onRefund={() => handleRefundPayment(localPaymentData.id)}
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
      
      {/* Refund Dialog for payment plan installments */}
      {paymentToRefund && (
        <PaymentRefundDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          onRefund={processRefund}
          paymentId={paymentToRefund}
          isLoading={isRefundProcessing}
        />
      )}
    </div>
  );
};

export default PlanDetails;
