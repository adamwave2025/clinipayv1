
import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MoreVertical, Edit, Copy, ArrowRight, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BadgeCheck, Circle, PauseCircle, PlayCircle, AlertCircle, DollarSign, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import PlanActivityCard from './PlanActivityCard';
import ReschedulePaymentDialog from './ReschedulePaymentDialog';
import TakePaymentDialog from './TakePaymentDialog';
import MarkAsPaidDialog from './MarkAsPaidDialog';
import RefundPaymentDialog from './RefundPaymentDialog';
import PlanActionDialogs from './PlanActionDialogs';

const PlanDetailsView = () => {
  const navigate = useNavigate();
  
  const {
    selectedPlan,
    showPlanDetails,
    setShowPlanDetails,
    installments,
    activities,
    isLoading,
    isLoadingActivities,
    handleBackToPlans,
    handleSendReminder,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    handleTakePayment,
    preparePaymentData,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    onPaymentUpdated,
    selectedInstallment,
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog,
    processRefund,
    showCancelDialog,
    setShowCancelDialog,
    handleCancelPlan,
    handleOpenCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    handlePausePlan,
    handleOpenPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    handleOpenResumeDialog,
    hasSentPayments,
    hasOverduePayments,
    isProcessing,
    isPlanPaused,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    handleOpenRescheduleDialog,
    showReschedulePaymentDialog,
    setShowReschedulePaymentDialog,
    maxAllowedDate,
    setPaymentToRefund, // Add this missing prop
  } = useManagePlansContext();
  
  useEffect(() => {
    if (!selectedPlan && showPlanDetails) {
      console.warn("Plan details view is open but no plan is selected");
      // Optionally, navigate back or show a message
    }
  }, [selectedPlan, showPlanDetails]);
  
  if (!showPlanDetails || !selectedPlan) {
    return null; // Or a message indicating no plan is selected
  }
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline"><BadgeCheck className="mr-2 h-4 w-4" /> Active</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-amber-600 border-amber-600"><PauseCircle className="mr-2 h-4 w-4" /> Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="mr-2 h-4 w-4" /> Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary"><Circle className="mr-2 h-4 w-4" /> Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="mr-2 h-4 w-4" /> Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  };
  
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(amount / 100);
    } catch (error) {
      console.error("Error formatting currency:", amount, error);
      return 'Invalid Amount';
    }
  };
  
  const renderInstallmentStatus = (installment: PlanInstallment) => {
    switch (installment.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paid':
        return <Badge variant="outline">Paid</Badge>; // Changed from "success" to "outline"
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'sent':
        return <Badge variant="outline">Sent</Badge>;
      default:
        return <Badge>{installment.status}</Badge>;
    }
  };
  
  const handleCopyPaymentLink = () => {
    if (selectedPlan?.paymentLink) {
      toast.success("Payment link copied to clipboard");
    } else {
      toast.error("No payment link available to copy");
    }
  };

  return (
    <Drawer
      open={showPlanDetails}
      onOpenChange={setShowPlanDetails}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{selectedPlan?.title || selectedPlan?.planName || 'Payment Plan'} Details</DrawerTitle>
          <DrawerDescription>
            View and manage the details of this payment plan.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Information</CardTitle>
              <CardDescription>Details about the selected payment plan.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Patient Name</p>
                <p>{selectedPlan?.patientName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Plan Status</p>
                {renderStatusBadge(selectedPlan?.status || 'unknown')}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Start Date</p>
                <p>{formatDate(selectedPlan?.startDate || '')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Amount</p>
                <p>{formatCurrency(selectedPlan?.totalAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Frequency</p>
                <p>{selectedPlan?.frequency}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Number of Payments</p>
                <p>{selectedPlan?.numberOfPayments}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Payment Link</p>
                <div className="flex items-center space-x-2">
                  <a 
                    href={selectedPlan?.paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {selectedPlan?.paymentLink ? 'View Payment Link' : 'No Link'}
                  </a>
                  {selectedPlan?.paymentLink && (
                    <CopyToClipboard text={selectedPlan.paymentLink} onCopy={handleCopyPaymentLink}>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CopyToClipboard>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-4" />

          <Card>
            <CardHeader>
              <CardTitle>Installments</CardTitle>
              <CardDescription>Scheduled payments for this plan.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Render skeleton loading rows
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                      </TableRow>
                    ))
                  ) : installments.length > 0 ? (
                    // Render actual installment data
                    installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>{installment.paymentNumber} of {installment.totalPayments}</TableCell>
                        <TableCell>{formatDate(installment.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(installment.amount)}</TableCell>
                        <TableCell>{renderInstallmentStatus(installment)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleTakePayment(installment.id, installment)}>
                                <DollarSign className="mr-2 h-4 w-4" /> Take Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(installment.id)}>
                                <BadgeCheck className="mr-2 h-4 w-4" /> Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenReschedule(installment.id)}>
                                <CalendarClock className="mr-2 h-4 w-4" /> Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendReminder()}>
                                <ArrowRight className="mr-2 h-4 w-4" /> Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                if (setPaymentToRefund) {
                                  setPaymentToRefund(installment.paymentId || null);
                                }
                                openRefundDialog();
                              }}>
                                <ArrowRight className="mr-2 h-4 w-4" /> Refund Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Render message if no installments are available
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No installments found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Separator className="my-4" />

          <Card>
            <CardHeader>
              <CardTitle>Plan Activity</CardTitle>
              <CardDescription>Recent activities related to this plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanActivityCard activities={activities} isLoading={isLoadingActivities} />
            </CardContent>
          </Card>
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={handleBackToPlans}>
            Back to Plans
          </Button>
        </DrawerFooter>
      </DrawerContent>
      
      {/* Action Dialogs */}
      <PlanActionDialogs
        showCancelDialog={showCancelDialog}
        setShowCancelDialog={setShowCancelDialog}
        showPauseDialog={showPauseDialog}
        setShowPauseDialog={setShowPauseDialog}
        showResumeDialog={showResumeDialog}
        setShowResumeDialog={setShowResumeDialog}
        showRescheduleDialog={showRescheduleDialog}
        setShowRescheduleDialog={setShowRescheduleDialog}
        selectedPlan={selectedPlan}
        handleCancelPlan={handleCancelPlan}
        handlePausePlan={handlePausePlan}
        handleResumePlan={handleResumePlan}
        handleReschedulePlan={handleReschedulePlan}
        isProcessing={isProcessing}
        hasSentPayments={hasSentPayments}
        hasOverduePayments={hasOverduePayments}
      />
      
      {/* Payment reschedule dialog */}
      <ReschedulePaymentDialog
        open={showReschedulePaymentDialog}
        onOpenChange={setShowReschedulePaymentDialog}
        onConfirm={handleReschedulePayment}
        isLoading={isProcessing}
        maxAllowedDate={maxAllowedDate}
      />
      
      {/* Take payment dialog */}
      <TakePaymentDialog
        open={showTakePaymentDialog}
        onOpenChange={setShowTakePaymentDialog} // Changed from setOpen to onOpenChange
        paymentData={selectedPlan ? {
          paymentId: selectedInstallment?.id || '',
          patientName: selectedPlan?.patientName || '',
          patientEmail: selectedPlan?.patientEmail || '',
          patientPhone: selectedPlan?.patients?.phone || '',
          amount: selectedInstallment?.amount || 0,
          isValid: true
        } : null}
        onPaymentSuccess={onPaymentUpdated}
      />
      
      {/* Mark as paid dialog */}
      <MarkAsPaidDialog
        open={showMarkAsPaidDialog}
        setOpen={setShowMarkAsPaidDialog}
        onConfirm={confirmMarkAsPaid}
        isLoading={isProcessing}
      />
      
      {/* Refund payment dialog */}
      <RefundPaymentDialog
        open={refundDialogOpen}
        setOpen={setRefundDialogOpen}
        paymentId={paymentToRefund}
        onRefundSuccess={processRefund}
      />
    </Drawer>
  );
};

export default PlanDetailsView;
