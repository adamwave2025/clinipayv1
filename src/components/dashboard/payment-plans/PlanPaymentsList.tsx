
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

interface PlanPaymentsListProps {
  installments: PlanInstallment[];
  onMarkAsPaid: (paymentId: string) => void;
  onReschedule: (paymentId: string) => void;
  onTakePayment?: (paymentId: string) => void;
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
          {installments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No payments scheduled
              </TableCell>
            </TableRow>
          ) : (
            installments.map((installment) => {
              const status = determineStatus(installment);
              
              return (
                <TableRow key={installment.id}>
                  <TableCell>
                    {installment.paymentNumber} of {installment.totalPayments}
                  </TableCell>
                  <TableCell>{formatDate(installment.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(installment.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {status !== 'paid' && (
                      <PaymentActionMenu
                        paymentId={installment.id}
                        onMarkAsPaid={onMarkAsPaid}
                        onReschedule={onReschedule}
                        onTakePayment={onTakePayment}
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
