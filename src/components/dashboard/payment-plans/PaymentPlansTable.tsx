
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentPlansTableProps {
  filteredPlans: PaymentLink[];
  isLoading: boolean;
  paymentPlans: PaymentLink[];
  onCreatePlanClick: () => void;
  onEditPlan: (plan: PaymentLink) => void;
  onDeletePlan: (plan: PaymentLink) => void;
}

const PaymentPlansTable = ({
  filteredPlans,
  isLoading,
  paymentPlans,
  onCreatePlanClick,
  onEditPlan,
  onDeletePlan
}: PaymentPlansTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle>All Payment Plans</CardTitle>
        <Button 
          className="btn-gradient" 
          onClick={onCreatePlanClick}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            <LoadingSpinner />
            <p className="mt-2">Loading payment plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {paymentPlans.length === 0 ? (
              <>
                <p>No payment plans found. Create your first payment plan to get started.</p>
                <Button 
                  className="mt-4 btn-gradient" 
                  onClick={onCreatePlanClick}
                >
                  Create First Payment Plan
                </Button>
              </>
            ) : (
              <p>No payment plans match your search criteria.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount per Payment</TableHead>
                <TableHead>Payment Cycle</TableHead>
                <TableHead>Number of Payments</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.title}</TableCell>
                  <TableCell>{plan.description || '-'}</TableCell>
                  <TableCell>{formatCurrency(plan.amount)}</TableCell>
                  <TableCell className="capitalize">{plan.paymentCycle || '-'}</TableCell>
                  <TableCell>{plan.paymentCount || '-'}</TableCell>
                  <TableCell>{formatCurrency(plan.planTotalAmount || 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditPlan(plan)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onDeletePlan(plan)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentPlansTable;
