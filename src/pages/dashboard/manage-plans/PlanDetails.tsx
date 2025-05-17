
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
import { usePaymentDetailsFetcher } from '@/hooks/payment-plans/usePaymentDetailsFetcher';
import { PaymentRefundService } from '@/services/PaymentRefundService';
import { toast } from 'sonner';

const PlanDetails = () => {
  const {
    selectedPlan,
    installments,
    activities,
    isLoadingActivities,
    isRefreshing,
    handleBackToPlans,
    handleMarkAsPaid,
    handleReschedulePayment,
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment,
    isProcessing,
    
    // Context's existing payment dialog state
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    viewDetailsInstallment,
    
    // Add plan operation handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleSendReminder,
    refreshPlanState
  } = useManagePlansContext();
  
  // Create a local state for enhanced payment details
  const [viewInstallment, setViewInstallment] = useState<PlanInstallment | null>(null);
  const [localPaymentData, setLocalPaymentData] = useState<Payment | null>(null);
  const [showLocalPaymentDetails, setShowLocalPaymentDetails] = useState(false);
  
  // Use payment details fetcher for enhanced data
  const { fetchPaymentDetails, isLoading: isLoadingPaymentDetails } = usePaymentDetailsFetcher();
  
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

  // Function to handle viewing details of an installment with enhanced data
  const handleViewInstallmentDetails = async (installment: PlanInstallment) => {
    console.log('Viewing details for installment:', installment);
    setViewInstallment(installment);
    
    try {
      // Fetch complete payment details using the fetcher
      const paymentInfo = await fetchPaymentDetails(installment);
      
      if (paymentInfo) {
        console.log('Fetched enhanced payment details:', paymentInfo);
        setLocalPaymentData(paymentInfo);
        setShowLocalPaymentDetails(true);
      } else {
        // Fallback to creating a minimal payment object if fetch fails
        const fallbackPayment: Payment = {
          id: installment.id,
          amount: installment.amount,
          clinicId: selectedPlan?.clinicId || '',
          date: installment.paidDate || installment.dueDate,
          netAmount: installment.amount,
          patientName: selectedPlan?.patientName || '',
          status: installment.status,
          paymentMethod: installment.manualPayment ? 'manual' : 'card',
          manualPayment: installment.manualPayment || false,
          type: 'payment_plan',
          linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
        };
        
        setLocalPaymentData(fallbackPayment);
        setShowLocalPaymentDetails(true);
        
        // Only show a toast for paid installments where we expected to find data
        if (installment.status === 'paid') {
          toast.info('Limited payment information available');
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Could not load payment details');
    }
  };

  // Handle refund process for a payment
  const handleRefundPayment = async (paymentId: string) => {
    if (!paymentId) {
      toast.error('Invalid payment ID');
      return;
    }
    
    try {
      console.log('Processing refund for payment ID:', paymentId);
      toast.loading('Processing refund...');
      
      const result = await PaymentRefundService.processRefund(paymentId);
      
      if (result.success) {
        toast.success('Payment refunded successfully');
        setShowLocalPaymentDetails(false);
        
        // Refresh the plan data to show updated payment status
        if (selectedPlan?.id) {
          await refreshPlanState(selectedPlan.id);
        }
      } else {
        toast.error(`Refund failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Refund processing error');
    }
  };
  
  // Create a wrapper function for the handleOpenReschedule method to match the expected signature
  const handleRescheduleWrapper = (installmentId: string) => {
    if (handleOpenReschedule) {
      console.log('Calling handleOpenReschedule for installment ID:', installmentId);
      handleOpenReschedule(installmentId);
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
        onReschedule={handleRescheduleWrapper} 
        onTakePayment={handleOpenReschedule ? (id, details) => handleOpenReschedule(id) : undefined}
        onViewDetails={handleViewInstallmentDetails}
        isLoading={isLoadingActivities}
        isRefreshing={isRefreshing}
        onOpenCancelDialog={handleOpenCancelDialog}
        onOpenPauseDialog={handleOpenPauseDialog}
        onOpenResumeDialog={handleOpenResumeDialog}
        onOpenRescheduleDialog={handleOpenRescheduleDialog}
        onSendReminder={() => selectedPlan && handleSendReminder(selectedPlan.id)}
      />
      
      {/* Context-provided payment dialog */}
      {paymentData && (
        <PaymentDetailDialog
          payment={paymentData}
          open={showPaymentDetails}
          onOpenChange={setShowPaymentDetails}
        />
      )}
      
      {/* Enhanced local payment dialog with refund capability */}
      {localPaymentData && (
        <PaymentDetailDialog
          payment={localPaymentData}
          open={showLocalPaymentDetails}
          onOpenChange={setShowLocalPaymentDetails}
          onRefund={handleRefundPayment}
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
