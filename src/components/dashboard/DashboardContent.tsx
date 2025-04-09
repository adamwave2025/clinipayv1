
import React from 'react';
import PaymentStatsCards from './PaymentStatsCards';
import PaymentLinksCard from './PaymentLinksCard';
import RecentPaymentsCard from './RecentPaymentsCard';
import PaymentDetailDialog from './PaymentDetailDialog';
import PaymentRefundDialog from './payments/PaymentRefundDialog';
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

  return (
    <>
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
      />
    </>
  );
};

export default DashboardContent;
