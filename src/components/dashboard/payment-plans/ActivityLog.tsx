
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanActivity, getActionTypeLabel } from '@/utils/planActivityUtils';
import { formatDateTime, formatCurrency, formatDate } from '@/utils/formatters';
import { 
  Clock, MessageCircle, AlertCircle, CheckCircle, 
  Ban, PauseCircle, PlayCircle, CalendarClock, FileText,
  ChevronDown, ChevronUp, CreditCard, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';

interface ActivityLogProps {
  activities: PlanActivity[];
  isLoading?: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, isLoading = false }) => {
  // State to track which activities are expanded to show more details
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  const toggleActivityExpansion = (id: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
        return <CalendarClock className="h-4 w-4 text-blue-500" />;
      case 'pause':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      case 'resume':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'cancel':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'payment_made':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_refund':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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

  // Render detailed content based on activity type
  const renderActivityDetails = (activity: PlanActivity) => {
    const { actionType, details } = activity;

    if (!details) return null;

    switch (actionType) {
      case 'payment_made':
        return (
          <div className="space-y-1 text-sm">
            {details.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formatCurrency(details.amount)}</span>
              </div>
            )}
            {details.paymentRef && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium">{details.paymentRef}</span>
              </div>
            )}
            {details.installmentNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Installment:</span>
                <span className="font-medium">{details.installmentNumber} of {details.totalInstallments || '?'}</span>
              </div>
            )}
          </div>
        );
      
      case 'payment_refund':
        return (
          <div className="space-y-1 text-sm">
            {details.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Refund amount:</span>
                <span className="font-medium">{formatCurrency(details.amount)}</span>
              </div>
            )}
            {details.refundFee !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Refund fee:</span>
                <span className="font-medium">{formatCurrency(details.refundFee)}</span>
              </div>
            )}
            {details.paymentRef && (
              <div className="flex justify-between">
                <span className="text-gray-600">Original payment:</span>
                <span className="font-medium">{details.paymentRef}</span>
              </div>
            )}
            {details.reason && (
              <div className="mt-1">
                <span className="text-gray-600">Reason: </span>
                <span>{details.reason}</span>
              </div>
            )}
          </div>
        );
      
      case 'reschedule':
        return (
          <div className="space-y-1 text-sm">
            {details.previousDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Previous date:</span>
                <span className="font-medium">{formatDate(details.previousDate)}</span>
              </div>
            )}
            {details.newDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">New date:</span>
                <span className="font-medium">{formatDate(details.newDate)}</span>
              </div>
            )}
          </div>
        );
      
      case 'pause':
        return (
          <div className="space-y-1 text-sm">
            {details.pausedInstallments && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paused installments:</span>
                <span className="font-medium">{details.pausedInstallments}</span>
              </div>
            )}
            {details.reason && (
              <div className="mt-1">
                <span className="text-gray-600">Reason: </span>
                <span>{details.reason}</span>
              </div>
            )}
          </div>
        );
      
      case 'resume':
        return (
          <div className="space-y-1 text-sm">
            {details.resumeDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Resume date:</span>
                <span className="font-medium">{formatDate(details.resumeDate)}</span>
              </div>
            )}
            {details.hasSentPayments && (
              <div className="mt-1 text-amber-600">
                Plan had previously sent payment links that were paused.
              </div>
            )}
          </div>
        );
      
      case 'cancel':
        return (
          <div className="space-y-1 text-sm">
            {details.cancelledInstallments && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled installments:</span>
                <span className="font-medium">{details.cancelledInstallments}</span>
              </div>
            )}
            {details.reason && (
              <div className="mt-1">
                <span className="text-gray-600">Reason: </span>
                <span>{details.reason}</span>
              </div>
            )}
          </div>
        );
      
      case 'create':
        return (
          <div className="space-y-1 text-sm">
            {details.totalAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total amount:</span>
                <span className="font-medium">{formatCurrency(details.totalAmount)}</span>
              </div>
            )}
            {details.installmentAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Installment amount:</span>
                <span className="font-medium">{formatCurrency(details.installmentAmount)}</span>
              </div>
            )}
            {details.totalInstallments && (
              <div className="flex justify-between">
                <span className="text-gray-600">Number of installments:</span>
                <span className="font-medium">{details.totalInstallments}</span>
              </div>
            )}
            {details.frequency && (
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium">{details.frequency}</span>
              </div>
            )}
          </div>
        );
      
      case 'reminder_sent':
        return (
          <div className="space-y-1 text-sm">
            {details.installmentNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Installment:</span>
                <span className="font-medium">{details.installmentNumber} of {details.totalInstallments || '?'}</span>
              </div>
            )}
            {details.dueDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Due date:</span>
                <span className="font-medium">{formatDate(details.dueDate)}</span>
              </div>
            )}
            {details.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formatCurrency(details.amount)}</span>
              </div>
            )}
            {details.sentTo && (
              <div className="mt-1">
                <span className="text-gray-600">Sent to: </span>
                <span>{details.sentTo}</span>
              </div>
            )}
          </div>
        );
      
      case 'overdue':
        return (
          <div className="space-y-1 text-sm">
            {details.overdue_count && (
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue payments:</span>
                <span className="font-medium">{details.overdue_count}</span>
              </div>
            )}
            {details.overdue_items && details.overdue_items.length > 0 && (
              <div className="mt-1">
                <span className="text-gray-600 block mb-1">Overdue installments:</span>
                <div className="ml-2 space-y-1">
                  {details.overdue_items.map((item: any, i: number) => (
                    <div key={i} className="text-xs flex justify-between">
                      <span>Payment #{item.payment_number}</span>
                      <span>{formatDate(item.due_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {details.previous_status && (
              <div className="flex justify-between">
                <span className="text-gray-600">Previous plan status:</span>
                <span className="font-medium capitalize">{details.previous_status}</span>
              </div>
            )}
          </div>
        );
      
      default:
        // Show generic message info if available
        return details.message ? (
          <div className="mt-1 text-sm">
            <span>{details.message}</span>
          </div>
        ) : null;
    }
  };

  if (isLoading) {
    return (
      <div className="pt-2">
        <h3 className="text-md font-semibold mb-2">Activity Log</h3>
        <div className="flex justify-center py-4 border rounded-md">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h3 className="text-md font-semibold mb-2">Activity Log</h3>
      {activities.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border rounded-md">
          No activity recorded yet
        </div>
      ) : (
        <div className="border rounded-md">
          <ScrollArea className="h-[300px] p-2">
            <div className="space-y-3 p-2">
              {activities.map(activity => {
                const isExpanded = expandedActivities[activity.id] || false;
                const hasDetails = activity.details && 
                  (activity.details.message || 
                   Object.keys(activity.details).some(key => key !== 'message'));
                
                return (
                  <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.actionType)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">{getActionTypeLabel(activity.actionType)}</p>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(activity.performedAt, 'en-GB', 'Europe/London')}
                          </span>
                        </div>
                        
                        {/* Simple message display if available and not expanded */}
                        {!isExpanded && activity.details && activity.details.message && (
                          <p className="text-sm text-gray-600">{activity.details.message}</p>
                        )}
                        
                        {/* Show expand button if the activity has details */}
                        {hasDetails && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs flex items-center gap-1 hover:bg-gray-100"
                            onClick={() => toggleActivityExpansion(activity.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                <span>Less details</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                <span>More details</span>
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="bg-gray-50 p-2 rounded-md mt-1">
                            {renderActivityDetails(activity)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
