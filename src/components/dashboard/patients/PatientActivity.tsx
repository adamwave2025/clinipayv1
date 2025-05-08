import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { getActionTypeLabel } from '@/utils/planActivityUtils';
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
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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
                      {payment.title ? `${payment.title} - ` : ''}
                      Payment {payment.status === 'refunded' ? 'Refunded' : 'Received'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(payment.amount || 0)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
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
                    <span className="font-medium">{getActionTypeLabel(activity.actionType)}</span>
                  </div>
                  <p className="text-sm text-gray-500">
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
