
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Payment } from '@/types/payment';
import { ArrowLeft } from 'lucide-react';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentActionsSection from '@/components/dashboard/payment-details/PaymentActionsSection';
import { formatCurrency } from '@/utils/formatters';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

interface InstallmentPaymentDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  paymentData: Payment | null;
  installment?: PlanInstallment | null; // Add installment prop to show info even without payment data
  onBack: () => void;
  onRefund?: () => void;
}

const InstallmentPaymentDialog = ({
  showDialog,
  setShowDialog,
  paymentData,
  installment,
  onBack,
  onRefund
}: InstallmentPaymentDialogProps) => {
  const handleBack = () => {
    onBack();
  };
  
  // For debugging
  console.log('Payment data in InstallmentPaymentDialog:', paymentData);
  console.log('Installment data in InstallmentPaymentDialog:', installment);
  
  // Use installment data if paymentData is null (for non-paid installments)
  const isPaymentData = paymentData !== null;
  const displayTitle = paymentData?.linkTitle || 
    (installment ? `Payment #${installment.paymentNumber} of ${installment.totalPayments}` : 'Payment Details');
  
  // If we have no data at all, don't render the dialog
  if (!paymentData && !installment) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 p-0 h-8 w-8" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Payment Details</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{displayTitle}</h3>
            {/* Show status badge from either payment data or installment */}
            {(paymentData || installment) && (
              <StatusBadge 
                status={(paymentData?.status || installment?.status) as any} 
                manualPayment={paymentData?.manualPayment} 
              />
            )}
          </div>

          <PaymentDetailsCard
            details={[
              { 
                label: 'Patient Name', 
                value: paymentData?.patientName || 'Not available' 
              },
              { 
                label: 'Patient Email', 
                value: paymentData?.patientEmail || 'Not provided' 
              },
              { 
                label: 'Payment Date', 
                value: paymentData?.date || (installment?.paidDate ? new Date(installment.paidDate).toLocaleDateString() : 'Not paid yet') 
              },
              { 
                label: 'Due Date', 
                value: installment?.dueDate ? new Date(installment.dueDate).toLocaleDateString() : 'Not available' 
              },
              { 
                label: 'Payment Amount', 
                value: (paymentData?.amount || installment?.amount) ? formatCurrency(paymentData?.amount || installment?.amount) : 'Not available' 
              },
              { 
                label: 'Reference', 
                value: paymentData?.reference || 'Not available' 
              },
              { 
                label: 'Status', 
                value: paymentData?.status || installment?.status || 'Unknown' 
              },
              { 
                label: 'Type', 
                value: paymentData?.manualPayment ? 'Manual Payment' : 'Payment Plan Installment' 
              }
            ]}
          />

          {/* Only show payment actions when we have payment data */}
          {isPaymentData && (
            <PaymentActionsSection
              status={paymentData.status}
              onRefund={onRefund}
              manualPayment={paymentData.manualPayment}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallmentPaymentDialog;
