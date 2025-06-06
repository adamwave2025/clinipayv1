
import React from 'react';
import { Plan } from '@/utils/planTypes';
import CancelPlanDialog from './CancelPlanDialog';
import PausePlanDialog from './PausePlanDialog';
import ResumePlanDialog from './ResumePlanDialog';
import ReschedulePlanDialog from './ReschedulePlanDialog';

interface PlanActionDialogsProps {
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  showPauseDialog: boolean;
  setShowPauseDialog: (show: boolean) => void;
  showResumeDialog: boolean;
  setShowResumeDialog: (show: boolean) => void;
  showRescheduleDialog: boolean;
  setShowRescheduleDialog: (show: boolean) => void;
  
  selectedPlan: Plan | null;
  
  handleCancelPlan: () => Promise<void>;
  handlePausePlan: () => Promise<void>;
  handleResumePlan: (resumeDate?: Date) => Promise<void>;
  handleReschedulePlan: (newStartDate: Date) => Promise<void>;
  
  isProcessing: boolean;
  hasSentPayments?: boolean;
  hasOverduePayments?: boolean;
  hasPaidPayments?: boolean;
}

/**
 * Shared component for rendering all plan action dialogs
 * This can be used in both the main payment plans area and the patient details area
 */
const PlanActionDialogs: React.FC<PlanActionDialogsProps> = ({
  showCancelDialog,
  setShowCancelDialog,
  showPauseDialog,
  setShowPauseDialog,
  showResumeDialog,
  setShowResumeDialog,
  showRescheduleDialog,
  setShowRescheduleDialog,
  selectedPlan,
  handleCancelPlan,
  handlePausePlan,
  handleResumePlan,
  handleReschedulePlan,
  isProcessing,
  hasSentPayments = false,
  hasOverduePayments = false,
  hasPaidPayments = false // Add this prop with default value
}) => {
  return (
    <>
      <CancelPlanDialog
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        onConfirm={handleCancelPlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      <PausePlanDialog
        showDialog={showPauseDialog}
        setShowDialog={setShowPauseDialog}
        onConfirm={handlePausePlan}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
      />

      <ResumePlanDialog
        showDialog={showResumeDialog}
        setShowDialog={setShowResumeDialog}
        onConfirm={(resumeDate) => handleResumePlan(resumeDate)}
        planName={selectedPlan?.title || ''}
        patientName={selectedPlan?.patientName || ''}
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
        hasPaidPayments={hasPaidPayments} // Add this prop
      />

      <ReschedulePlanDialog
        showDialog={showRescheduleDialog}
        setShowDialog={setShowRescheduleDialog}
        onConfirm={handleReschedulePlan}
        planName={selectedPlan?.title || selectedPlan?.planName || 'Payment Plan'}
        patientName={selectedPlan?.patientName || 'Patient'}
        startDate={selectedPlan?.startDate} // Add this prop
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
    </>
  );
};

export default PlanActionDialogs;
