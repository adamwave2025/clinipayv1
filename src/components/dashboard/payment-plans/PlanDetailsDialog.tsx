
import React from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanInstallment } from '@/utils/paymentPlanUtils';
import PlanActionsDropdown from './PlanActionsDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlanDetailsDialogProps {
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  selectedPlan: Plan | null;
  installments: PlanInstallment[];
  onSendReminder: (installmentId: string) => void;
  onViewPaymentDetails: (installment: PlanInstallment) => void;
  onCancelPlan: () => void;
  onPausePlan: () => void;
  onResumePlan: () => void;
  isPlanPaused: (plan: Plan | null) => boolean;
}

const PlanDetailsDialog = ({
  showPlanDetails,
  setShowPlanDetails,
  selectedPlan,
  installments,
  onSendReminder,
  onViewPaymentDetails,
  onCancelPlan,
  onPausePlan,
  onResumePlan,
  isPlanPaused
}: PlanDetailsDialogProps) => {
  if (!selectedPlan) return null;
  
  const isDisabled = selectedPlan.status === 'completed' || selectedPlan.status === 'cancelled';
  const isPaused = isPlanPaused(selectedPlan);

  return (
    <Sheet open={showPlanDetails} onOpenChange={setShowPlanDetails}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-2xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="text-left">Plan Details</SheetTitle>
          <PlanActionsDropdown 
            onCancelPlan={onCancelPlan}
            onPausePlan={onPausePlan}
            onResumePlan={onResumePlan}
            isPaused={isPaused}
            isDisabled={isDisabled}
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
              <p className="font-medium">{selectedPlan.planName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant="outline"
                className={`
                  ${selectedPlan.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  ${selectedPlan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${selectedPlan.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                  ${selectedPlan.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                  ${selectedPlan.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : ''}
                  ${selectedPlan.status === 'paused' ? 'bg-amber-100 text-amber-700' : ''}
                `}
              >
                {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">£{selectedPlan.amount.toFixed(2)}</p>
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
                  ? new Date(selectedPlan.nextDueDate).toLocaleDateString() 
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow 
                        key={installment.id}
                      >
                        <TableCell>{installment.dueDate}</TableCell>
                        <TableCell>£{installment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`
                              ${installment.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                              ${installment.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : ''}
                              ${installment.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                              ${installment.status === 'sent' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${installment.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : ''}
                              ${installment.status === 'paused' ? 'bg-amber-100 text-amber-700' : ''}
                            `}
                          >
                            {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{installment.paidDate || '-'}</TableCell>
                        <TableCell className="text-right">
                          {installment.status === 'paid' && (
                            <button 
                              className="text-sm font-medium text-primary hover:underline"
                              onClick={() => onViewPaymentDetails(installment)}
                            >
                              View Payment
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlanDetailsDialog;
