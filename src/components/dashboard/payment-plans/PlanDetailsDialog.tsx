
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface PlanDetailsDialogProps {
  showPlanDetails: boolean;
  setShowPlanDetails: (show: boolean) => void;
  selectedPlan: any | null;
  mockInstallments: any[];
}

const PlanDetailsDialog = ({ 
  showPlanDetails, 
  setShowPlanDetails, 
  selectedPlan,
  mockInstallments
}: PlanDetailsDialogProps) => {
  if (!selectedPlan) return null;

  return (
    <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Plan Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
                  className={`
                    ${selectedPlan.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                    ${selectedPlan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${selectedPlan.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
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
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Payment Schedule</h4>
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
                {mockInstallments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>£{installment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        className={`
                          ${installment.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                          ${installment.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${installment.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                        `}
                      >
                        {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {installment.status === 'upcoming' && (
                        <Button size="sm" variant="outline">
                          Send Reminder
                        </Button>
                      )}
                      {installment.status === 'paid' && (
                        <span className="text-sm text-gray-500">
                          Paid on {new Date(installment.paidDate!).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline">Edit Plan</Button>
          <Button className="btn-gradient">Send Statement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailsDialog;
