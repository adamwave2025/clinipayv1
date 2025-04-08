
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import RecentPaymentsCard, { Payment } from '@/components/dashboard/RecentPaymentsCard';
import PaymentStatsCards from '@/components/dashboard/PaymentStatsCards';
import PaymentLinksCard, { PaymentLink } from '@/components/dashboard/PaymentLinksCard';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import { toast } from 'sonner';

const DashboardPage = () => {
  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@example.com',
      patientPhone: '+44 7700 900123',
      amount: 75.00,
      date: '2025-04-08',
      status: 'paid',
      type: 'deposit',
    },
    {
      id: '2',
      patientName: 'Michael Brown',
      patientEmail: 'michael.b@example.com',
      patientPhone: '+44 7700 900456',
      amount: 125.00,
      date: '2025-04-07',
      status: 'paid',
      type: 'treatment',
    },
    {
      id: '3',
      patientName: 'Emily Davis',
      patientEmail: 'emily.d@example.com',
      patientPhone: '+44 7700 900789',
      amount: 50.00,
      date: '2025-04-07',
      status: 'refunded',
      type: 'consultation',
    },
    {
      id: '4',
      patientName: 'James Wilson',
      patientEmail: 'james.w@example.com',
      patientPhone: '+44 7700 900246',
      amount: 100.00,
      date: '2025-04-06',
      status: 'pending',
      type: 'deposit',
    },
    {
      id: '5',
      patientName: 'Jennifer Lee',
      patientEmail: 'jennifer.l@example.com',
      patientPhone: '+44 7700 900135',
      amount: 85.00,
      date: '2025-04-05',
      status: 'failed',
      type: 'treatment',
    },
  ]);

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([
    {
      id: '1',
      title: 'Consultation Deposit',
      amount: 50.00,
      type: 'deposit',
      url: 'https://clinipay.com/pay/abc123',
      createdAt: '2025-04-08',
    },
    {
      id: '2',
      title: 'Full Treatment Package',
      amount: 250.00,
      type: 'treatment',
      url: 'https://clinipay.com/pay/def456',
      createdAt: '2025-04-06',
    },
    {
      id: '3',
      title: 'Follow-up Consultation',
      amount: 75.00,
      type: 'consultation',
      url: 'https://clinipay.com/pay/ghi789',
      createdAt: '2025-04-02',
    },
  ]);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = {
    totalReceivedToday: 200.00,
    totalPendingToday: 100.00,
    totalReceivedMonth: 1875.50,
    totalRefundedMonth: 225.00,
  };

  const handleRefund = (paymentId: string) => {
    // Mock refund process
    setPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.id === paymentId
          ? { ...payment, status: 'refunded' as const }
          : payment
      )
    );
    
    toast.success('Payment refunded successfully');
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Dashboard" 
        description="View and manage your payments"
        action={
          <Button className="btn-gradient" asChild>
            <Link to="/dashboard/create-link">
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Link>
          </Button>
        }
      />
      
      <PaymentStatsCards stats={stats} />
      
      <div className="mb-8">
        <PaymentLinksCard links={paymentLinks} />
      </div>
      
      <RecentPaymentsCard 
        payments={payments} 
        onRefund={handleRefund}
        onPaymentClick={handlePaymentClick}
      />

      <PaymentDetailDialog
        payment={selectedPayment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRefund={handleRefund}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
