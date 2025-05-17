
import React from 'react';
import { Plan } from '@/utils/planTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PlanProgressCard from './PlanProgressCard';
import PlanDetailsCard from './PlanDetailsCard';
import PlanActionsCard from './PlanActionsCard';
import PlanScheduleCard from './PlanScheduleCard';
import PlanActivityCard from './PlanActivityCard';
import { PlanActivity } from '@/utils/planActivityUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

interface PlanDetailsViewProps {
  plan: Plan;
  installments: any[];
  activities: PlanActivity[];
  onMarkAsPaid: (id: string, installment: any) => void;
  onReschedule: (id: string) => void;
  onTakePayment: (id: string, installment: any) => void;
  onViewDetails: (installment: PlanInstallment) => void;  // Add this new prop
  isLoading: boolean;
  isRefreshing?: boolean;
  onOpenCancelDialog?: () => void;
  onOpenPauseDialog?: () => void;
  onOpenResumeDialog?: () => void;
  onOpenRescheduleDialog?: () => void;
  onSendReminder?: () => void;
}

const PlanDetailsView: React.FC<PlanDetailsViewProps> = ({ 
  plan, 
  installments, 
  activities, 
  onMarkAsPaid,
  onReschedule,
  onTakePayment,
  onViewDetails,  // Add this new prop
  isLoading,
  isRefreshing = false,
  onOpenCancelDialog,
  onOpenPauseDialog,
  onOpenResumeDialog,
  onOpenRescheduleDialog,
  onSendReminder
}) => {
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Updating plan...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        {isRefreshing && <LoadingOverlay />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <PlanProgressCard plan={plan} isLoading={isLoading} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <PlanDetailsCard plan={plan} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      <div className="relative">
        {isRefreshing && <LoadingOverlay />}
        <PlanActionsCard 
          plan={plan}
          onOpenCancelDialog={onOpenCancelDialog}
          onOpenPauseDialog={onOpenPauseDialog}
          onOpenResumeDialog={onOpenResumeDialog}
          onOpenRescheduleDialog={onOpenRescheduleDialog}
          onSendReminder={onSendReminder}
        />
      </div>
      
      <div className="relative">
        {isRefreshing && <LoadingOverlay />}
        <Card>
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule">
              <CardContent className="p-0 pt-4">
                <PlanScheduleCard 
                  installments={installments}
                  isLoading={isLoading}
                  onMarkAsPaid={onMarkAsPaid}
                  onReschedule={onReschedule}
                  onTakePayment={onTakePayment}
                  onViewDetails={onViewDetails} // Pass the handler to view details
                />
              </CardContent>
            </TabsContent>
            
            <TabsContent value="activity">
              <CardContent className="p-0 pt-4">
                <PlanActivityCard 
                  activities={activities}
                  isLoading={isLoading}
                />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default PlanDetailsView;
