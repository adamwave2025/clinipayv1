
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Payment } from '@/types/payment';
import { ArrowLeft } from 'lucide-react';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentActionsSection from '@/components/dashboard/payment-details/PaymentActionsSection';

interface InstallmentPaymentDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  paymentData: Payment | null;
  onBack: () => void;
  onRefund?: () => void;
}

const InstallmentPaymentDialog = ({
  showDialog,
  setShowDialog,
  paymentData,
  onBack,
  onRefund
}: InstallmentPaymentDialogProps) => {
  if (!paymentData) return null;

  const handleBack = () => {
    onBack();
  };

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
            <h3 className="text-lg font-medium">{paymentData.linkTitle || 'Payment'}</h3>
            <StatusBadge status={paymentData.status} />
          </div>

          <PaymentDetailsCard
            details={[
              { label: 'Patient Name', value: paymentData.patientName },
              { label: 'Patient Email', value: paymentData.patientEmail || 'Not provided' },
              { label: 'Payment Date', value: paymentData.date },
              { label: 'Payment Amount', value: paymentData.amount },
              { label: 'Reference', value: paymentData.reference || 'Not available' },
              { label: 'Type', value: 'Payment Plan Installment' }
            ]}
          />

          {/* Add PaymentActionsSection for refund functionality */}
          <PaymentActionsSection
            status={paymentData.status}
            onRefund={onRefund}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallmentPaymentDialog;
