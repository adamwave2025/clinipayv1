
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime, formatCurrency, formatDate } from '@/utils/formatters';
import { getActionTypeLabel, capitalize } from '@/utils/planActivityUtils';
import {
  Clock,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Ban,
  PauseCircle,
  PlayCircle,
  CalendarClock,
  FileText,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PatientActivityProps {
  payments: any[];
  planActivities: any[];
  isLoading?: boolean;
}

const PatientActivity: React.FC<PatientActivityProps> = ({ 
  payments, 
  planActivities,
  isLoading = false
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
      case 'reschedule_plan':
        return <CalendarClock className="h-4 w-4 text-blue-500" />;
      case 'pause':
      case 'pause_plan':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      case 'resume':
      case 'resume_plan':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'cancel':
      case 'cancel_plan':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'payment_made':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'payment_refund':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'reminder_sent':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'create':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'complete':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.actionType) {
      case 'payment_made':
        return `Payment of ${formatCurrency(activity.details?.amount || 0)} received`;
      case 'payment_refund':
        return `Payment of ${formatCurrency(activity.details?.amount || 0)} ${activity.details?.refundFee ? 'partially refunded' : 'refunded'}`;
      case 'reschedule':
      case 'reschedule_plan':
        return `Plan rescheduled to ${formatDate(activity.details?.newDate || activity.details?.new_start_date)}`;
      case 'pause':
      case 'pause_plan':
        return 'Plan paused';
      case 'resume':
      case 'resume_plan':
        return 'Plan resumed';
      case 'cancel':
      case 'cancel_plan':
        return 'Plan cancelled';
      case 'create':
        const count = activity.details?.totalInstallments || activity.details?.total_payments || activity.details?.total_installments || 0;
        const frequency = activity.details?.frequency || activity.details?.payment_frequency || 'monthly';
        return `Plan created with ${count} ${capitalize(frequency)} installments`;
      case 'complete':
      case 'completed':
        return `Plan completed - ${formatCurrency(activity.details?.totalPaid || activity.details?.total_paid || 0)} paid`;
      case 'reminder_sent':
        return `Payment reminder sent for installment ${activity.details?.installmentNumber || 0}`;
      case 'overdue':
        const count = activity.details?.overdue_count || (activity.details?.overdue_items?.length || 0);
        return `${count} payment${count !== 1 ? 's are' : ' is'} overdue`;
      default:
        return getActionTypeLabel(activity.actionType);
    }
  };

  // Function to get payment details
  const getPaymentDetails = (payment: any) => {
    return (
      <>
        {payment.title && <p>{payment.title}</p>}
        {payment.reference && <p>Reference: {payment.reference}</p>}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Activity Log</h3>
      {(payments.length === 0 && planActivities.length === 0) ? (
        <div className="text-center py-6 text-gray-500 border rounded-md">
          No activity recorded yet
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {/* Payment History */}
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="mt-1">
                  {getActivityIcon(payment.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {payment.status === 'refunded' ? 'Payment Refunded' : 'Payment Received'}
                      {' '}{formatCurrency(payment.amount || 0)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {payment.title && <p>{payment.title}</p>}
                    {payment.reference && <p>Reference: {payment.reference}</p>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(payment.date, 'en-GB', 'Europe/London')}
                  </p>
                </div>
              </div>
            ))}

            {/* Plan Activities */}
            {planActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="mt-1">
                  {getActivityIcon(activity.actionType)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{getActivityDescription(activity)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(activity.performedAt, 'en-GB', 'Europe/London')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PatientActivity;
