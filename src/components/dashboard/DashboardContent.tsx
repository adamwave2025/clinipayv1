
import React from 'react';
import PaymentStatsCards from './PaymentStatsCards';
import PaymentLinksCard from './PaymentLinksCard';
import RecentPaymentsCard from './RecentPaymentsCard';
import PaymentDetailDialog from './PaymentDetailDialog';
import PaymentRefundDialog from './payments/PaymentRefundDialog';
import LaunchPadCard from './LaunchPadCard';
import { useDashboardData } from './DashboardDataProvider';
import { useClinicData } from '@/hooks/useClinicData';

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

  // Get clinic data to determine Stripe connection status
  const { clinicData } = useClinicData();
  
  // Determine if Stripe is connected based on stripe_status field
  const stripeConnected = clinicData?.stripe_status === 'connected';

  // Check if any payment requests (sent links) exist in the payments array
  const hasSentPaymentLink = payments.some(payment => payment.status === 'sent');

  return (
    <>
      <LaunchPadCard 
        stripeConnected={stripeConnected} 
        paymentLinksExist={paymentLinks.length > 0}
        hasSentPaymentLink={hasSentPaymentLink}
      />
      
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
