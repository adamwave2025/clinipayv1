
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import PaymentActionMenu from './PaymentActionMenu';
import { toast } from '@/hooks/use-toast';

interface PlanPaymentsListProps {
  installments: PlanInstallment[];
  onMarkAsPaid: (paymentId: string, installmentDetails: PlanInstallment) => void;
  onReschedule: (paymentId: string) => void;
  onTakePayment?: (paymentId: string, installmentDetails: PlanInstallment) => void;
}

const PlanPaymentsList: React.FC<PlanPaymentsListProps> = ({
  installments,
  onMarkAsPaid,
  onReschedule,
  onTakePayment
}) => {
  const determineStatus = (installment: PlanInstallment): 'paid' | 'upcoming' | 'overdue' => {
    if (installment.status === 'paid') {
      return 'paid';
    }
    
    // If status is already overdue, keep it that way
    if (installment.status === 'overdue') {
      return 'overdue';
    }
    
    // Otherwise check date
    const now = new Date();
    const dueDate = new Date(installment.dueDate);
    
    if (dueDate < now) {
      return 'overdue';
    }
    
    return 'upcoming';
  };

  // Enhanced debugging - log the installments to see their structure
  console.log("PlanPaymentsList rendering with installments:", 
    installments?.map(i => ({
      id: i.id, 
      status: i.status, 
      paymentNumber: i.paymentNumber,
      totalPayments: i.totalPayments,
      paidDate: i.paidDate,
      amount: i.amount,
      dueDate: i.dueDate,
      manualPayment: i.manualPayment
    }))
  );

  // Create wrapper functions to log when actions are triggered
  const handleMarkAsPaid = (paymentId: string, installment: PlanInstallment) => {
    console.log("PlanPaymentsList: Mark as paid clicked for payment:", paymentId);
    console.log("PlanPaymentsList: Installment details:", installment);
    toast.info(`Initiating Mark as Paid workflow for payment ${paymentId}`);
    onMarkAsPaid(paymentId, installment);
  };

  const handleReschedule = (paymentId: string) => {
    console.log("PlanPaymentsList: Reschedule clicked for payment:", paymentId);
    toast.info(`Initiating Reschedule workflow for payment ${paymentId}`);
    onReschedule(paymentId);
  };

  // Improved validation for take payment action
  const handleTakePayment = onTakePayment ? (paymentId: string, installment: PlanInstallment) => {
    console.log("PlanPaymentsList: Take payment clicked for payment:", paymentId);
    console.log("PlanPaymentsList: Full installment data:", JSON.stringify(installment, null, 2));
    
    if (!installment || !installment.amount) {
      toast.error(`Missing payment data for payment ${paymentId}`);
      console.error("Missing amount data for installment:", installment);
      return;
    }
    
    // Pass the validated data up to the parent
    console.log("PlanPaymentsList: Passing complete installment to parent:", installment);
    onTakePayment(paymentId, installment);
  } : undefined;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment #</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!installments || installments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No payments scheduled
              </TableCell>
            </TableRow>
          ) : (
            installments.map((installment) => {
              // Safety check for installment object
              if (!installment || typeof installment !== 'object') {
                console.error("Invalid installment object:", installment);
                return null;
              }
              
              const status = determineStatus(installment);
              
              // Debug log to check each installment's payment information
              console.log(`Installment ${installment.id} status:`, {
                status,
                paidDate: installment.paidDate,
                manualPayment: installment.manualPayment || false,
                amount: installment.amount,
                paymentNumber: installment.paymentNumber,
                totalPayments: installment.totalPayments,
                dueDate: installment.dueDate
              });
              
              return (
                <TableRow key={installment.id}>
                  <TableCell>
                    {installment.paymentNumber} of {installment.totalPayments}
                  </TableCell>
                  <TableCell>{formatDate(installment.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(installment.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={status}
                      manualPayment={installment.manualPayment} 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {status !== 'paid' && (
                      <PaymentActionMenu
                        paymentId={installment.id}
                        installment={installment}
                        onMarkAsPaid={handleMarkAsPaid}
                        onReschedule={handleReschedule}
                        onTakePayment={handleTakePayment}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanPaymentsList;
