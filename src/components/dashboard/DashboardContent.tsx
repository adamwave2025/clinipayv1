
import React from 'react';
import PaymentStatsCards from './PaymentStatsCards';
import PaymentLinksCard from './PaymentLinksCard';
import RecentPaymentsCard from './RecentPaymentsCard';
import PaymentDetailDialog from './PaymentDetailDialog';
import PaymentRefundDialog from './payments/PaymentRefundDialog';
import LaunchPadCard from './LaunchPadCard';
import { useDashboardData } from './DashboardDataProvider';

const DashboardContent = () => {
  const {
    payments,
    paymentLinks,
    stats,
    selectedPayment,
    detailDialogOpen,
    refundDialogOpen,
    setDetailDialogOpen,
    setRefundDialogOpen,
    openRefundDialog,
    handlePaymentClick,
    handleRefund
  } = useDashboardData();

  // Determine if Stripe is connected based on payment stats
  // In a real implementation, this would be more robust
  const stripeConnected = stats.totalReceivedMonth > 0 || 
                         stats.totalReceivedToday > 0;

  return (
    <>
      <LaunchPadCard stripeConnected={stripeConnected} />
      
      <PaymentStatsCards stats={stats} />
      
      <div className="mb-8">
        <PaymentLinksCard links={paymentLinks} />
      </div>
      
      <RecentPaymentsCard 
        payments={payments} 
        onRefund={openRefundDialog}
        onPaymentClick={handlePaymentClick}
      />

      <PaymentDetailDialog
        payment={selectedPayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onRefund={openRefundDialog}
      />

      <PaymentRefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onConfirm={handleRefund}
        paymentAmount={selectedPayment?.amount}
        patientName={selectedPayment?.patientName}
      />
    </>
  );
};

export default DashboardContent;
