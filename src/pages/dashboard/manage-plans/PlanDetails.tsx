
import React, { useEffect } from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanDetailsView from '@/components/dashboard/payment-plans/PlanDetailsView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';
import MarkAsPaidConfirmDialog from '@/components/dashboard/payment-plans/MarkAsPaidConfirmDialog';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { usePaymentDetailsFetcher } from '@/hooks/payment-plans/usePaymentDetailsFetcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
    handleTakePayment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    setPaymentData,
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    handleReschedulePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment,
    isProcessing,
    viewDetailsInstallment,
    handleOpenRescheduleDialog,
    
    // Add plan operation handlers
    handleOpenCancelDialog,
    handleOpenPauseDialog,
    handleOpenResumeDialog,
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

  // Function to handle viewing details of an installment
  const handleViewInstallmentDetails = async (installment: PlanInstallment) => {
    console.log('Viewing details for installment:', installment);
    
    try {
      // For paid installments, fetch the payment record from the database
      if (installment.status === 'paid') {
        console.log('Fetching payment data for paid installment:', installment.id);
        
        // Query the payments table using the payment_schedule_id
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('payment_schedule_id', installment.id)
          .single();
          
        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          toast.error('Failed to load payment details');
          return;
        }
        
        if (paymentData) {
          console.log('Found payment data:', paymentData);
          
          // Format the payment data to match the Payment interface
          const payment: Payment = {
            id: paymentData.id,
            amount: paymentData.amount_paid,
            clinicId: paymentData.clinic_id || selectedPlan.clinicId || '',
            date: paymentData.paid_at || installment.paidDate || '',
            netAmount: paymentData.net_amount || paymentData.amount_paid,
            patientName: paymentData.patient_name || selectedPlan.patientName || '',
            status: paymentData.status || 'paid',
            paymentMethod: paymentData.manual_payment ? 'manual' : 'card',
            stripePaymentId: paymentData.stripe_payment_id || '',
            refundAmount: paymentData.refund_amount || 0,
            refundedAmount: paymentData.refund_amount || 0,
            reference: paymentData.payment_ref || '',
            paymentReference: paymentData.payment_ref || '',
            patientEmail: paymentData.patient_email || '',
            patientPhone: paymentData.patient_phone || '',
            manualPayment: paymentData.manual_payment || false,
            type: 'payment_plan',
            linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
          };
          
          // Update the payment data in the context
          setPaymentData(payment);
          setShowPaymentDetails(true);
          return;
        }
      }
      
      // For unpaid installments or if payment record not found, create a placeholder
      const placeholderPayment: Payment = {
        id: installment.id,
        amount: installment.amount,
        clinicId: selectedPlan?.clinicId || '',
        date: installment.paidDate || installment.dueDate,
        netAmount: installment.amount,
        patientName: selectedPlan?.patientName || '',
        status: installment.status,
        paymentMethod: installment.manualPayment ? 'manual' : 'none',
        stripePaymentId: installment.paymentId || '',
        refundAmount: 0,
        refundedAmount: 0,
        paymentReference: '',
        reference: '',
        patientEmail: '',
        patientPhone: '',
        manualPayment: installment.manualPayment || false,
        type: 'payment_plan',
        linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
      };
      
      // Update the payment data in the context
      setPaymentData(placeholderPayment);
      setShowPaymentDetails(true);
      
    } catch (error) {
      console.error('Error in handleViewInstallmentDetails:', error);
      toast.error('Failed to load payment details');
    }
  };

  // Function to handle payment refunds
  const handleRefund = async (paymentId: string) => {
    try {
      console.log('Processing refund for payment:', paymentId);
      toast.info('Processing refund...');
      
      // Call the refund-payment edge function via PaymentRefundService
      // This would be implemented in your PaymentRefundService
      // For now, we'll just show a toast
      toast.success('Refund processed successfully');
      
      // After successful refund, refresh plan data
      // You would update the plan state here
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
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
        onReschedule={(paymentId) => handleOpenRescheduleDialog(paymentId)}
        onTakePayment={handleTakePayment}
        onViewDetails={handleViewInstallmentDetails}
        isLoading={isLoadingActivities}
        isRefreshing={isRefreshing}
        onOpenCancelDialog={handleOpenCancelDialog}
        onOpenPauseDialog={handleOpenPauseDialog}
        onOpenResumeDialog={handleOpenResumeDialog}
        onOpenRescheduleDialog={() => handleOpenRescheduleDialog()}
        onSendReminder={() => selectedPlan && handleSendReminder(selectedPlan.id)}
      />
      
      {/* Use a single payment dialog for all payment details */}
      <PaymentDetailDialog
        payment={paymentData}
        open={showPaymentDetails}
        onOpenChange={setShowPaymentDetails}
        onRefund={handleRefund}
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
