
import React from 'react';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PlanDetailsView from '@/components/dashboard/payment-plans/PlanDetailsView';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import ReschedulePaymentDialog from '@/components/dashboard/payment-plans/ReschedulePaymentDialog';

const PlanDetails = () => {
  const {
    selectedPlan,
    installments,
    activities,
    isLoadingActivities,
    handleBackToPlans,
    handleMarkAsPaid,
    handleOpenReschedule,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePayment,
    isProcessing
  } = useManagePlansContext();
  
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
        isLoading={isLoadingActivities}
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
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        onConfirm={handleReschedulePayment}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default PlanDetails;
