
import React from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import PlanActionsDropdown from './PlanActionsDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import StatusBadge, { StatusType } from '@/components/common/StatusBadge';
import ActivityLog from './ActivityLog';
import { formatCurrency, formatDateTime, formatDate } from '@/utils/formatters';
import PaymentActionMenu from './PaymentActionMenu';
import { Loader2 } from 'lucide-react';

interface PlanDetailsDialogProps {
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  selectedPlan: Plan | null;
  installments: PlanInstallment[];
  activities: PlanActivity[];
  isLoadingActivities?: boolean;
  onSendReminder: (installmentId: string) => void;
  onViewPaymentDetails: (installment: PlanInstallment) => void;
  onCancelPlan: () => void;
  onPausePlan: () => void;
  onResumePlan: () => void;
  onReschedulePlan: () => void;
  isPlanPaused: (plan: Plan | null) => boolean;
  onMarkAsPaid?: (installmentId: string) => void;
  onReschedule?: (installmentId: string) => void;
  onTakePayment?: (installmentId: string, installmentDetails?: PlanInstallment) => void;
}

const PlanDetailsDialog = ({
  showPlanDetails,
  setShowPlanDetails,
  selectedPlan,
  installments,
  activities,
  isLoadingActivities = false,
  onSendReminder,
  onViewPaymentDetails,
  onCancelPlan,
  onPausePlan,
  onResumePlan,
  onReschedulePlan,
  isPlanPaused,
  onMarkAsPaid,
  onReschedule,
  onTakePayment
}: PlanDetailsDialogProps) => {
  if (!selectedPlan) return null;
  
  const isDisabled = selectedPlan.status === 'completed' || selectedPlan.status === 'cancelled';
  const isPaused = isPlanPaused(selectedPlan);

  // Function to handle row click and navigate to payment details
  const handleRowClick = (installment: PlanInstallment, e: React.MouseEvent) => {
    // Only trigger click for paid, refunded, or partially_refunded installments and don't navigate when clicking action buttons
    if ((installment.status === 'paid' || installment.status === 'refunded' || installment.status === 'partially_refunded') && !e.defaultPrevented) {
      console.log("Row clicked for installment:", installment);
      onViewPaymentDetails(installment);
    }
  };

  // Function to determine if an installment row should be clickable
  const isClickableInstallment = (status: string): boolean => {
    return status === 'paid' || status === 'refunded' || status === 'partially_refunded';
  };

  return (
    <Sheet open={showPlanDetails} onOpenChange={setShowPlanDetails}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-2xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="text-left">Plan Details</SheetTitle>
          <PlanActionsDropdown 
            onCancelPlan={onCancelPlan}
            onPausePlan={!isPlanPaused(selectedPlan) ? onPausePlan : undefined}
            onResumePlan={isPlanPaused(selectedPlan) ? onResumePlan : undefined}
            onReschedulePlan={onReschedulePlan}
            isPaused={isPlanPaused(selectedPlan)}
            isDisabled={isDisabled}
            isLoading={isLoadingActivities}
          />
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{selectedPlan.patientName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{selectedPlan.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={selectedPlan.status} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">{formatCurrency(selectedPlan.totalAmount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full" 
                    style={{ width: `${selectedPlan.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {selectedPlan.paidInstallments}/{selectedPlan.totalInstallments}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Next Due Date</p>
              <p className="font-medium">
                {selectedPlan.nextDueDate 
                  ? formatDate(selectedPlan.nextDueDate)
                  : isPlanPaused(selectedPlan) ? 'Plan paused' : 'No upcoming payments'}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-2">Installments</h3>
            <div className="border rounded-md">
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      {/* Add Actions column if action handlers are provided */}
                      {(onMarkAsPaid || onReschedule || onTakePayment) && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow 
                        key={installment.id}
                        onClick={(e) => handleRowClick(installment, e)}
                        className={isClickableInstallment(installment.status) 
                          ? "cursor-pointer hover:bg-muted transition-colors" 
                          : ""}
                      >
                        <TableCell>{formatDate(installment.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(installment.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={installment.status as StatusType} 
                            originalStatus={installment.originalStatus as string | undefined}
                            manualPayment={installment.manualPayment}
                          />
                        </TableCell>
                        <TableCell>
                          {installment.paidDate 
                            ? formatDateTime(installment.paidDate, 'en-GB', 'Europe/London') 
                            : '-'}
                        </TableCell>
                        {/* Add Actions column with PaymentActionMenu for unpaid installments */}
                        {(onMarkAsPaid || onReschedule || onTakePayment) && (
                          <TableCell className="text-right">
                            {installment.status !== 'paid' && 
                             installment.status !== 'refunded' && 
                             installment.status !== 'partially_refunded' && (
                              <PaymentActionMenu
                                paymentId={installment.id}
                                installment={installment}
                                onMarkAsPaid={onMarkAsPaid || (() => {})}
                                onReschedule={onReschedule || (() => {})}
                                onTakePayment={onTakePayment ? 
                                  (id: string, instDetails: PlanInstallment) => onTakePayment(id, instDetails) : undefined}
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
          
          {/* Activity Log */}
          <ActivityLog 
            activities={activities} 
            isLoading={isLoadingActivities} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlanDetailsDialog;
