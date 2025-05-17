
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
    
    // Add plan operation handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
    handleOpenRescheduleDialog,
    handleSendReminder
  } = useManagePlansContext();
  
  // Create a local state to handle the payment detail dialog
  const [viewInstallment, setViewInstallment] = useState<PlanInstallment | null>(null);
  const [localPaymentData, setLocalPaymentData] = useState<Payment | null>(null);
  const [showLocalPaymentDetails, setShowLocalPaymentDetails] = useState(false);
  
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
  const handleViewInstallmentDetails = (installment: PlanInstallment) => {
    console.log('Viewing details for installment:', installment);
    setViewInstallment(installment);
    
    // Create a payment object from the installment data
    const installmentPayment: Payment = {
      id: installment.id,
      amount: installment.amount,
      clinicId: selectedPlan?.clinicId || '',
      date: installment.paidDate || installment.dueDate,
      netAmount: installment.amount,
      patientName: selectedPlan?.patientName || '',
      status: installment.status,
      paymentMethod: installment.manualPayment ? 'manual' : 'card',
      // Set other required fields with appropriate values or defaults
      stripePaymentId: installment.paymentId || '',
      refundAmount: 0,
      refundedAmount: 0,
      // Optional fields
      paymentReference: '',
      reference: '',
      patientEmail: '',
      patientPhone: '',
      manualPayment: installment.manualPayment || false,
      type: 'payment_plan',
      linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
    };
    
    setLocalPaymentData(installmentPayment);
    setShowLocalPaymentDetails(true);
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
          onRefund={() => {}}
        />
      )}
      
      {/* Use local payment dialog for installment clicks */}
      {localPaymentData && (
        <PaymentDetailDialog
          payment={localPaymentData}
          open={showLocalPaymentDetails}
          onOpenChange={setShowLocalPaymentDetails}
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
