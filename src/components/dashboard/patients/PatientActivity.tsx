
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime, formatCurrency, formatDate } from '@/utils/formatters';
import { getActionTypeLabel, capitalize } from '@/utils/planActivityUtils';
import {
  CreditCard,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Ban,
  PauseCircle,
  PlayCircle,
  CalendarClock,
  FileText,
  RefreshCcw,
  SendHorizonal
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
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4 pb-2">
            {/* Payment History - Updated with different icons based on reference */}
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="mt-1">
                  {payment.reference ? (
                    <CreditCard className="h-4 w-4 text-green-500" />
                  ) : (
                    <SendHorizonal className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                  {payment.reference ? `Payment received for ${formatCurrency(payment.amount || 0)}` : `Payment request sent for ${formatCurrency(payment.amount || 0)}`}
                  </div>
                  <div className="mt-1 space-y-1 text-sm">
                    {/* Display payment source differently based on type */}
                    {payment.type === 'payment_plan' ? (
                      <p>Payment plan: {payment.title || 'Payment Plan'}</p>
                    ) : (
                      <p>Reusable link: {payment.title || 'Payment'}</p>
                    )}
                    {payment.reference && <p>Reference: {payment.reference}</p>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(payment.date, 'en-GB', 'Europe/London')}
                  </p>
                </div>
              </div>
            ))}

            {/* Only include specific activity types for patient view */}
            {planActivities
              .filter(activity => 
                ['payment_made', 'payment_refund', 'partial_refund', 'card_payment_processed'].includes(activity.actionType))
              .map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="mt-1">
                    {activity.actionType.includes('refund') ? (
                      <RefreshCcw className="h-4 w-4 text-orange-500" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {activity.actionType.includes('refund') 
                        ? `Payment ${activity.actionType === 'partial_refund' ? 'partially' : 'fully'} refunded for ${formatCurrency(activity.details?.refundAmount || 0)}` 
                        : `Payment received for ${formatCurrency(activity.details?.amount || 0)}`}
                    </div>
                    <div className="mt-1 space-y-1 text-sm">
                      <p>{activity.details?.planName ? `Payment plan: ${activity.details.planName}` : 'Payment'}</p>
                      {activity.details?.reference && <p>Reference: {activity.details.reference}</p>}
                      {activity.details?.payment_reference && <p>Reference: {activity.details.payment_reference}</p>}
                      {activity.details?.payment_ref && <p>Reference: {activity.details.payment_ref}</p>}
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
