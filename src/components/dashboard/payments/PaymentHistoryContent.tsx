
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import PaymentTable from '@/components/dashboard/payments/PaymentTable';
import PaymentDetailDialog from '@/components/dashboard/PaymentDetailDialog';
import PaymentRefundDialog from '@/components/dashboard/payments/PaymentRefundDialog';
import PaymentHistoryFilters from '@/components/dashboard/payments/PaymentHistoryFilters';
import { toast } from 'sonner';
import { generatePaymentsCsv, downloadCsv } from '@/utils/csvExport';
import { format } from 'date-fns';
import { parse } from 'date-fns';
import { Payment } from '@/types/payment';

const PaymentHistoryContent: React.FC = () => {
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

  const filteredPayments = filterPayments(payments, {
    search,
    dateRange,
    typeFilter,
    statusFilter
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
          <PaymentHistoryFilters
            search={search}
            setSearch={setSearch}
            dateRange={dateRange}
            setDateRange={setDateRange}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onDownloadReport={handleDownloadReport}
          />
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
        onRefund={() => selectedPayment && openRefundDialog(selectedPayment.id)}
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

// Helper function to filter payments based on filter criteria
function filterPayments(
  payments: Payment[], 
  filters: {
    search: string;
    dateRange: DateRange | undefined;
    typeFilter: string;
    statusFilter: string;
  }
): Payment[] {
  const { search, dateRange, typeFilter, statusFilter } = filters;
  
  return payments.filter(payment => {
    const matchesSearch = search === '' || 
      payment.patientName.toLowerCase().includes(search.toLowerCase()) ||
      payment.patientEmail?.toLowerCase().includes(search.toLowerCase()) ||
      payment.patientPhone?.includes(search) ||
      payment.reference?.includes(search);
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange?.from || dateRange?.to) {
      const paymentDate = parse(payment.date, 'dd/MM/yyyy', new Date());
      console.log('payment date', paymentDate, dateRange);

      
      if (dateRange.from && dateRange.to) {
        matchesDateRange = isWithinInterval(paymentDate, { start: dateRange.from, end: dateRange.to });
      } else if (dateRange.from) {
        matchesDateRange = paymentDate >= dateRange.from;
      } else if (dateRange.to) {
        matchesDateRange = paymentDate <= dateRange.to;
      }
    }
    
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesDateRange && matchesType && matchesStatus;
  });
}

export default PaymentHistoryContent;
