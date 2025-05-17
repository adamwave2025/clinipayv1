
import React from 'react';
import { Button } from '@/components/ui/button';
import { Payment, PaymentStatus } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentRefundService } from '@/services/PaymentRefundService';
import { useRefundState } from '@/hooks/payment-plans/useRefundState';
import RefundDialog from '@/components/dialogs/RefundDialog';
import { formatCurrency } from '@/utils/formatters';

interface PaymentActionsSectionProps {
  payment: Payment;
  onRefundComplete?: () => Promise<void>;
  disableRefundButton?: boolean;
  payments?: Payment[]; // Optional array of payments to update
  setPayments?: React.Dispatch<React.SetStateAction<Payment[]>>;
}

const PaymentActionsSection = ({
  payment,
  onRefundComplete,
  disableRefundButton = false,
  payments,
  setPayments
}: PaymentActionsSectionProps) => {
  const {
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    setPaymentToRefund,
    openRefundDialog,
    processRefund
  } = useRefundState();

  // Helper function to check if payment is refundable
  const isRefundable = (payment: Payment) => {
    return payment.status === PaymentStatus.COMPLETED ||
           payment.status === 'completed' ||
           payment.status === 'paid' || 
           payment.status === 'partially_refunded';
  };

  const handleRefund = async (amount?: number) => {
    if (!payment || !payment.id) {
      toast.error('No payment data available');
      return;
    }

    try {
      // If amount is provided, it's in pounds (decimal)
      // The service will convert it to pence (integer) if needed
      const result = await PaymentRefundService.processRefund(payment.id, amount);
      
      if (!result.success) {
        toast.error(`Refund failed: ${result.error}`);
        return;
      }

      // Use the updated refund amount from the response
      const refundAmount = result.refundFee !== undefined
        ? `(fee: ${formatCurrency(result.refundFee * 100)})`
        : '';
      
      toast.success(`Refund processed successfully ${refundAmount}`);
      
      // Update the local payments state if available
      if (payments && setPayments) {
        // Convert refund amount to pence for consistency with payment.amount
        // amount here is in pounds (from the dialog), we need to convert to pence for comparison
        const refundAmountInPence = amount ? amount * 100 : payment.amount;
        const updatedPayments = PaymentRefundService.getUpdatedPaymentAfterRefund(
          payments, 
          payment.id, 
          amount || payment.amount / 100
        );
        setPayments(updatedPayments);
      }
      
      // Call the onRefundComplete callback if provided
      if (onRefundComplete) {
        await onRefundComplete();
      }
    } catch (error: any) {
      toast.error(`Error processing refund: ${error.message}`);
    } finally {
      setRefundDialogOpen(false);
    }
  };

  return (
    <>
      {/* Refund button */}
      {isRefundable(payment) && !disableRefundButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPaymentToRefund(payment.id);
            setRefundDialogOpen(true);
          }}
          className="text-destructive hover:bg-destructive/10"
        >
          Refund
        </Button>
      )}

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        paymentId={paymentToRefund}
        onRefund={handleRefund}
        paymentAmount={payment?.amount}
      />
    </>
  );
};

export default PaymentActionsSection;
