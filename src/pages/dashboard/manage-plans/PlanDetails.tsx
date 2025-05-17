
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
import { supabase } from '@/integrations/supabase/client';
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
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);
  
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

  // Function to fetch complete payment data from the database
  const fetchCompletePaymentData = async (installment: PlanInstallment): Promise<Payment | null> => {
    console.log('Fetching complete payment data for installment:', installment);
    setIsLoadingPaymentDetails(true);
    
    try {
      // Check if this is a paid installment with a payment ID
      if (installment.status === 'paid' && installment.paymentId) {
        // Fetch the complete payment record with all details
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id, 
            amount_paid, 
            paid_at, 
            patient_name, 
            patient_email, 
            patient_phone, 
            status, 
            payment_ref, 
            stripe_payment_id,
            refund_amount,
            net_amount,
            clinic_id,
            manual_payment,
            patient_id
          `)
          .eq('id', installment.paymentId)
          .single();
          
        if (error) {
          console.error('Error fetching payment:', error);
          toast.error('Could not load complete payment details');
          return null;
        }
        
        if (data) {
          console.log('Found payment data:', data);
          
          // Create a properly formatted Payment object
          const completePayment: Payment = {
            id: data.id,
            amount: data.amount_paid,
            clinicId: data.clinic_id,
            date: data.paid_at,
            patientName: data.patient_name || selectedPlan?.patientName || 'Patient',
            patientEmail: data.patient_email || '',
            patientPhone: data.patient_phone || '',
            status: data.status || 'paid',
            netAmount: data.net_amount || data.amount_paid,
            paymentMethod: data.manual_payment ? 'manual' : 'card',
            reference: data.payment_ref,
            paymentReference: data.payment_ref,
            stripePaymentId: data.stripe_payment_id,
            refundAmount: data.refund_amount || 0,
            refundedAmount: data.refund_amount || 0,
            manualPayment: data.manual_payment || false,
            type: 'payment_plan',
            linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
          };
          
          return completePayment;
        }
      }
      
      // If payment not found or unpaid installment, return a placeholder Payment object
      return createPlaceholderPayment(installment);
      
    } catch (error) {
      console.error('Error in fetchCompletePaymentData:', error);
      toast.error('Failed to retrieve payment details');
      return createPlaceholderPayment(installment);
    } finally {
      setIsLoadingPaymentDetails(false);
    }
  };
  
  // Helper function to create a placeholder Payment object for unpaid installments
  const createPlaceholderPayment = (installment: PlanInstallment): Payment => {
    return {
      id: installment.id,
      amount: installment.amount,
      clinicId: selectedPlan?.clinicId || '', // Fixed: Use clinicId instead of clinic_id
      date: installment.paidDate || installment.dueDate,
      netAmount: installment.amount,
      patientName: selectedPlan?.patientName || 'Patient',
      status: installment.status,
      paymentMethod: installment.manualPayment ? 'manual' : 'card',
      // Set other required fields with appropriate values
      stripePaymentId: installment.paymentId || '',
      refundAmount: 0,
      refundedAmount: 0,
      // Optional fields
      paymentReference: '',
      reference: '',
      patientEmail: selectedPlan?.patientEmail || '',
      patientPhone: selectedPlan?.patients?.phone || '',
      manualPayment: installment.manualPayment || false,
      type: 'payment_plan',
      linkTitle: `Payment ${installment.paymentNumber} of ${installment.totalPayments}`
    };
  };

  // Function to handle viewing details of an installment
  const handleViewInstallmentDetails = async (installment: PlanInstallment) => {
    console.log('Viewing details for installment:', installment);
    setViewInstallment(installment);
    
    // Fetch complete payment data
    const paymentData = await fetchCompletePaymentData(installment);
    
    if (paymentData) {
      setLocalPaymentData(paymentData);
      setShowLocalPaymentDetails(true);
    } else {
      toast.error('Could not retrieve payment details');
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
        isLoading={isLoadingActivities || isLoadingPaymentDetails}
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
