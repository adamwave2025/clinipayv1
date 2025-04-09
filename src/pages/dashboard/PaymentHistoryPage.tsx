
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/common/StatusBadge';
import { Input } from '@/components/ui/input';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDashboardData, DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import PaymentTable from '@/components/dashboard/payments/PaymentTable';

// Wrapper component to use the DashboardDataProvider context
const PaymentHistoryContent = () => {
  const { 
    payments, 
    handlePaymentClick, 
    openRefundDialog, 
    handleRefund,
    refundDialogOpen,
    setRefundDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedPayment 
  } = useDashboardData();

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = search === '' || 
      payment.patientName.toLowerCase().includes(search.toLowerCase()) ||
      payment.patientEmail?.toLowerCase().includes(search.toLowerCase()) ||
      payment.patientPhone?.includes(search);
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange?.from || dateRange?.to) {
      const paymentDate = parseISO(payment.date);
      
      if (dateRange.from && dateRange.to) {
        // Both from and to dates are set
        matchesDateRange = isWithinInterval(paymentDate, { start: dateRange.from, end: dateRange.to });
      } else if (dateRange.from) {
        // Only from date is set
        matchesDateRange = paymentDate >= dateRange.from;
      } else if (dateRange.to) {
        // Only to date is set
        matchesDateRange = paymentDate <= dateRange.to;
      }
    }
    
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesDateRange && matchesType && matchesStatus;
  });

  return (
    <>
      <Card className="card-shadow mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 input-focus"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-shadow">
        <CardContent className="p-6">
          <PaymentTable 
            payments={filteredPayments} 
            onPaymentClick={handlePaymentClick} 
          />
        </CardContent>
      </Card>
      
      <PaymentDetailDialog
        payment={selectedPayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onRefund={openRefundDialog}
      />

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayment && (
                <>
                  Are you sure you want to issue a refund for {formatCurrency(selectedPayment.amount)} to {selectedPayment.patientName}? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} className="bg-red-500 hover:bg-red-600">
              Yes, Refund Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const PaymentHistoryPage = () => {
  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment History" 
        description="View and manage all your payment transactions"
      />
      
      <DashboardDataProvider>
        <PaymentHistoryContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `£${amount.toFixed(2)}`;
};

export default PaymentHistoryPage;
