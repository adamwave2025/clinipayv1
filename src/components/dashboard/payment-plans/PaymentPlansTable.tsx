
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
import { Archive, PlusCircle, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentPlansTableProps {
  filteredPlans: PaymentLink[];
  isLoading: boolean;
  paymentPlans: PaymentLink[];
  onCreatePlanClick?: () => void;
  onArchivePlan: (plan: PaymentLink) => void;
  onUnarchivePlan: (plan: PaymentLink) => void;
  isArchiveView: boolean;
  toggleArchiveView: () => void;
  onBackToActivePlans?: () => void;
  isTemplateView?: boolean;
}

const PaymentPlansTable = ({
  filteredPlans,
  isLoading,
  paymentPlans,
  onCreatePlanClick,
  onArchivePlan,
  onUnarchivePlan,
  isArchiveView,
  toggleArchiveView,
  onBackToActivePlans,
  isTemplateView = true
}: PaymentPlansTableProps) => {
  console.log('PaymentPlansTable props:', { 
    filteredPlansCount: filteredPlans.length,
    isLoading, 
    paymentPlansCount: paymentPlans.length,
    isArchiveView,
    isTemplateView
  });
  
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle>
          {isArchiveView 
            ? 'Archived Plan Templates' 
            : (isTemplateView ? 'All Plan Templates' : 'All Payment Plans')}
        </CardTitle>
        <div className="flex gap-2">
          {onBackToActivePlans && (
            <Button 
              variant="outline"
              onClick={onBackToActivePlans}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Active Plans
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={toggleArchiveView}
            className="flex items-center"
          >
            {isArchiveView ? (
              <>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                View Active Templates
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                View Archived
              </>
            )}
          </Button>
        </div>
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
                <p>
                  {isArchiveView 
                    ? 'No archived payment plans found.' 
                    : 'No payment plans found. Create your first payment plan to get started.'}
                </p>
                {!isArchiveView && onCreatePlanClick && (
                  <Button 
                    className="mt-4 btn-gradient" 
                    onClick={onCreatePlanClick}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Payment Plan
                  </Button>
                )}
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
                    <div className="flex justify-end">
                      {isArchiveView ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onUnarchivePlan(plan)}
                          className="text-green-500"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onArchivePlan(plan)}
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}
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
