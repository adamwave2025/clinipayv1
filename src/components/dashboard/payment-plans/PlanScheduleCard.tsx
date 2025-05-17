
import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import PaymentActionMenu from './PaymentActionMenu';

interface PlanScheduleCardProps {
  installments: PlanInstallment[];
  isLoading?: boolean;
  onMarkAsPaid?: (installmentId: string) => void;
  onReschedule?: (installmentId: string) => void;
  onTakePayment?: (installmentId: string, installmentDetails?: PlanInstallment) => void;
  onViewDetails?: (installment: PlanInstallment) => void;
}

const PlanScheduleCard: React.FC<PlanScheduleCardProps> = ({
  installments,
  isLoading = false,
  onMarkAsPaid,
  onReschedule,
  onTakePayment,
  onViewDetails,
}) => {
  const handleRowClick = (installment: PlanInstallment, e: React.MouseEvent) => {
    // Only trigger if not clicking on an action button (which has its own handlers)
    if (!e.defaultPrevented && onViewDetails) {
      console.log("Row clicked for installment:", installment);
      onViewDetails(installment);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Due Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Paid Date</TableHead>
          {(onMarkAsPaid || onReschedule || onTakePayment) && (
            <TableHead className="text-right">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map((installment) => (
          <TableRow 
            key={installment.id} 
            className="cursor-pointer hover:bg-muted transition-colors"
            onClick={(e) => handleRowClick(installment, e)}
          >
            <TableCell>{formatDate(installment.dueDate)}</TableCell>
            <TableCell>{formatCurrency(installment.amount)}</TableCell>
            <TableCell>
              <StatusBadge 
                status={installment.status} 
                originalStatus={installment.originalStatus}
                manualPayment={installment.manualPayment}
              />
            </TableCell>
            <TableCell>
              {installment.paidDate 
                ? formatDateTime(installment.paidDate, 'en-GB', 'Europe/London') 
                : '-'}
            </TableCell>
            {(onMarkAsPaid || onReschedule || onTakePayment) && (
              <TableCell className="text-right">
                {installment.status !== 'paid' && (
                  <PaymentActionMenu
                    paymentId={installment.id}
                    installment={installment}
                    onMarkAsPaid={onMarkAsPaid || (() => {})}
                    onReschedule={onReschedule || (() => {})}
                    onTakePayment={onTakePayment ? 
                      (id: string, installmentDetails?: PlanInstallment) => {
                        // Prevent the row click when clicking on menu actions
                        // We can't use e here since it's not in scope
                        if (onTakePayment) {
                          onTakePayment(id, installmentDetails);
                        }
                      } : undefined}
                  />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PlanScheduleCard;
