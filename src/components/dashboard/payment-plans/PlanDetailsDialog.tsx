
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';
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
    <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowPlanDetails(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <DialogTitle className="text-center flex-1">
              Plan Details
            </DialogTitle>
            <div>
              <PlanActionsDropdown 
                onCancelPlan={onCancelPlan}
                onPausePlan={onPausePlan}
                onResumePlan={onResumePlan}
                isPaused={isPaused}
                isDisabled={isDisabled}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
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
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
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
                      <TableCell className="font-medium">{installment.paymentNumber}</TableCell>
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
                        <div className="flex justify-end space-x-1">
                          {installment.status === 'paid' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onViewPaymentDetails(installment)}
                            >
                              View Payment
                            </Button>
                          )}
                          {(installment.status === 'upcoming' || installment.status === 'overdue') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onSendReminder(installment.id)}
                            >
                              <Bell className="h-3 w-3 mr-1" />
                              Remind
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailsDialog;
