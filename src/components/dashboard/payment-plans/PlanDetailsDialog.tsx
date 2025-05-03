
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PlanActionsDropdown from './PlanActionsDropdown';

interface PlanDetailsDialogProps {
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  selectedPlan: any | null;
  installments: any[];
  onSendReminder: (installmentId: string) => void;
  onViewPaymentDetails?: (installment: any) => void;
  onCancelPlan?: () => void;
  onPausePlan?: () => void;
}

const PlanDetailsDialog = ({ 
  showPlanDetails, 
  setShowPlanDetails, 
  selectedPlan,
  installments,
  onSendReminder,
  onViewPaymentDetails,
  onCancelPlan,
  onPausePlan
}: PlanDetailsDialogProps) => {
  if (!selectedPlan) return null;

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'paid':
        return 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700';
    }
  };

  return (
    <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle>Payment Plan Details</DialogTitle>
            
            {/* Replace direct cancel button with dropdown menu for active/pending plans */}
            {(selectedPlan.status === 'active' || selectedPlan.status === 'pending') && 
             selectedPlan.progress < 100 && (
              <PlanActionsDropdown
                onCancelPlan={() => onCancelPlan && onCancelPlan()}
                onPausePlan={onPausePlan}
              />
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-4rem)] px-6">
          <div className="space-y-6 py-4">
            {/* Plan Summary */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Patient</h4>
                  <p>{selectedPlan.patientName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Plan Name</h4>
                  <p>{selectedPlan.planName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                  <p>£{selectedPlan.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <Badge 
                    variant="outline"
                    className={`
                      ${selectedPlan.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700' : ''}
                      ${selectedPlan.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700' : ''}
                      ${selectedPlan.status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700' : ''}
                      ${selectedPlan.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700' : ''}
                    `}
                  >
                    {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Payment Progress</h4>
              <div className="flex items-center gap-3">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full" 
                    style={{ width: `${selectedPlan.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {selectedPlan.progress}% Complete
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {selectedPlan.paidInstallments} of {selectedPlan.totalInstallments} installments paid
              </p>
            </div>
            
            {/* Installments */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium">Payment Schedule</h4>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          Loading installment details...
                        </TableCell>
                      </TableRow>
                    ) : (
                      installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>£{installment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeClass(installment.status)}>
                              {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {installment.status === 'paid' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onViewPaymentDetails && onViewPaymentDetails(installment)}
                              >
                                View Payment
                              </Button>
                            ) : installment.status === 'upcoming' ? (
                              <span className="text-sm text-gray-500">-</span>
                            ) : installment.status === 'overdue' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onSendReminder(installment.id)}
                              >
                                Send Reminder
                              </Button>
                            )}
                            {installment.status === 'sent' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onSendReminder(installment.id)}
                              >
                                Resend Request
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailsDialog;
