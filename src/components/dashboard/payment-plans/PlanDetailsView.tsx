
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Plan } from '@/utils/planTypes';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { PlanActivity } from '@/utils/planActivityUtils';
import PlanPaymentsList from './PlanPaymentsList';
import ActivityLog from './ActivityLog';

interface PlanDetailsViewProps {
  plan: Plan;
  installments: PlanInstallment[];
  activities: PlanActivity[];
  onMarkAsPaid: (paymentId: string) => void;
  onReschedule: (paymentId: string) => void;
  isLoading: boolean;
}

const PlanDetailsView: React.FC<PlanDetailsViewProps> = ({
  plan,
  installments,
  activities,
  onMarkAsPaid,
  onReschedule,
  isLoading
}) => {
  // Always show "CliniPay" as the status with the purple gradient
  const renderPlanStatus = () => {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-primary">
        CliniPay
      </span>
    );
  };

  // Extract patient name - handle both data formats
  const patientName = plan.patientName || (plan.patients ? plan.patients.name : 'Unknown Patient');
    
  // Extract plan name/title - handle both data formats
  const planTitle = plan.title || plan.planName || 'Payment Plan';

  // Log plan details for debugging
  console.log('Plan details:', {
    id: plan.id,
    patientName,
    planTitle,
    paidInstallments: plan.paidInstallments,
    totalInstallments: plan.totalInstallments,
    progress: plan.progress,
  });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Plan Name:</dt>
                <dd className="text-gray-900">{planTitle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Patient:</dt>
                <dd className="text-gray-900">{patientName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Total Amount:</dt>
                <dd className="text-gray-900 font-medium">{formatCurrency(plan.totalAmount || plan.amount || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Start Date:</dt>
                <dd className="text-gray-900">{formatDate(plan.startDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Payment Frequency:</dt>
                <dd className="text-gray-900 capitalize">{plan.paymentFrequency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Status:</dt>
                <dd className="text-right">{renderPlanStatus()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-50 text-green-600">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      {plan.progress || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex h-2 mb-4 overflow-hidden rounded bg-green-100">
                  <div
                    style={{ width: `${plan.progress || 0}%` }}
                    className="bg-green-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xl font-semibold text-green-600">{plan.paidInstallments || 0}</p>
                  <p className="text-xs text-gray-500">Payments Made</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xl font-semibold text-blue-600">
                    {(plan.totalInstallments || 0) - (plan.paidInstallments || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Payments Remaining</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading payment schedule...
            </div>
          ) : (
            <PlanPaymentsList
              installments={installments}
              onMarkAsPaid={onMarkAsPaid}
              onReschedule={onReschedule}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLog activities={activities} isLoading={false} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanDetailsView;
