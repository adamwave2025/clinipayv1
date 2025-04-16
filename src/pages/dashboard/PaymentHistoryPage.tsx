
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
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
import { Download, Search } from 'lucide-react';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import { isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDashboardData, DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import PaymentTable from '@/components/dashboard/payments/PaymentTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generatePaymentsCsv, downloadCsv } from '@/utils/csvExport';
import { format } from 'date-fns';

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
      payment.patientPhone?.includes(search) ||
      payment.reference?.includes(search); // Include reference in search
    
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

  const handleDownloadReport = () => {
    if (filteredPayments.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Generate CSV data from filtered payments
      const csvData = generatePaymentsCsv(filteredPayments);
      
      // Create filename with CliniPay prefix and date range if available
      let filename = "CliniPay-Payment-History";
      if (dateRange?.from && dateRange?.to) {
        filename += `-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}`;
      } else {
        filename += `-${format(new Date(), 'yyyy-MM-dd')}`;
      }
      filename += ".csv";
      
      // Trigger download
      downloadCsv(csvData, filename);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate report");
    }
  };

  return (
    <>
      <Card className="card-shadow mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, email, phone or payment reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 input-focus"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
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
                    <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs flex items-center gap-1"
                onClick={handleDownloadReport}
              >
                <Download className="h-3 w-3" />
                Download Report
              </Button>
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

export default PaymentHistoryPage;
