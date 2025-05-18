
import React from 'react';
import PaymentStatsCards from './PaymentStatsCards';
import RecentPaymentsCard from './RecentPaymentsCard';
import PaymentDetailDialog from './PaymentDetailDialog';
import PaymentRefundDialog from './payments/PaymentRefundDialog';
import LaunchPadCard from './LaunchPadCard';
import { useDashboardData } from './DashboardDataProvider';
import { useClinicData } from '@/hooks/useClinicData';
import { Payment } from '@/types/payment';

const DashboardContent = () => {
  const {
    payments,
    paymentLinks,
    archivedLinks,
    stats,
    selectedPayment,
    detailDialogOpen,
    refundDialogOpen,
    isArchiveLoading,
    setDetailDialogOpen,
    setRefundDialogOpen,
    openRefundDialog,
    handlePaymentClick,
    handleRefund,
    archivePaymentLink,
    unarchivePaymentLink,
    rawPaymentLinks
  } = useDashboardData();

  // Get clinic data to determine Stripe connection status
  const { clinicData } = useClinicData();
  
  // Default values for new accounts or when data isn't loaded yet
  const stripeConnected = clinicData?.stripe_status === 'connected';
  
  // Updated to check both regular payment links AND payment plans
  // This ensures that creating a payment plan also completes the "create a payment link" task
  const paymentLinksExist = paymentLinks.length > 0 || rawPaymentLinks.some(link => link.paymentPlan === true);
  
  const hasSentPaymentLink = payments.some(payment => payment.status === 'sent');
  
  // Create a wrapper function that matches the expected signature
  const handleOpenRefund = () => {
    if (selectedPayment) {
      openRefundDialog(selectedPayment);
    }
  };

  return (
    <>
      <LaunchPadCard 
        stripeConnected={stripeConnected} 
        paymentLinksExist={paymentLinksExist}
        hasSentPaymentLink={hasSentPaymentLink}
      />
      
      <PaymentStatsCards stats={stats} />
      
      <div className="mb-8">
        <RecentPaymentsCard 
          payments={payments} 
          onRefund={openRefundDialog}
          onPaymentClick={handlePaymentClick}
        />
      </div>

      <PaymentDetailDialog
        payment={selectedPayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onRefund={handleOpenRefund}
      />

      <PaymentRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefund={handleRefund}
        paymentAmount={selectedPayment?.amount}
        patientName={selectedPayment?.patientName}
      />
    </>
  );
};

export default DashboardContent;
