
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import RecentPaymentsCard, { Payment } from '@/components/dashboard/RecentPaymentsCard';
import PaymentStatsCards from '@/components/dashboard/PaymentStatsCards';
import { toast } from 'sonner';

const DashboardPage = () => {
  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      patientName: 'Sarah Johnson',
      amount: 75.00,
      date: '2025-04-08',
      status: 'paid',
    },
    {
      id: '2',
      patientName: 'Michael Brown',
      amount: 125.00,
      date: '2025-04-07',
      status: 'paid',
    },
    {
      id: '3',
      patientName: 'Emily Davis',
      amount: 50.00,
      date: '2025-04-07',
      status: 'refunded',
    },
    {
      id: '4',
      patientName: 'James Wilson',
      amount: 100.00,
      date: '2025-04-06',
      status: 'pending',
    },
    {
      id: '5',
      patientName: 'Jennifer Lee',
      amount: 85.00,
      date: '2025-04-05',
      status: 'failed',
    },
  ]);

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
      
      <RecentPaymentsCard 
        payments={payments} 
        onRefund={handleRefund} 
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
