import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Payment } from '@/types/payment';
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
import { toast } from 'sonner';
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

const PaymentHistoryPage = () => {
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
      status: 'sent',
      type: 'deposit',
    },
    {
      id: '5',
      patientName: 'Jennifer Lee',
      patientEmail: 'jennifer.l@example.com',
      patientPhone: '+44 7700 900135',
      amount: 85.00,
      date: '2025-04-05',
      status: 'sent',
      type: 'treatment',
    },
    {
      id: '6',
      patientName: 'Robert Smith',
      patientEmail: 'robert.s@example.com',
      patientPhone: '+44 7700 900753',
      amount: 150.00,
      date: '2025-04-03',
      status: 'paid',
      type: 'treatment',
    },
    {
      id: '7',
      patientName: 'Lisa Thompson',
      patientEmail: 'lisa.t@example.com',
      patientPhone: '+44 7700 900951',
      amount: 55.00,
      date: '2025-04-01',
      status: 'paid',
      type: 'consultation',
    },
    {
      id: '8',
      patientName: 'Daniel Wilson',
      patientEmail: 'daniel.w@example.com',
      patientPhone: '+44 7700 900258',
      amount: 120.00,
      date: '2025-03-28',
      status: 'refunded',
      type: 'deposit',
    },
  ]);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundAlertOpen, setRefundAlertOpen] = useState(false);

  const handleRefundInitiate = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setRefundAlertOpen(true);
    }
  };

  const handleRefundConfirm = () => {
    if (selectedPayment) {
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === selectedPayment.id
            ? { ...payment, status: 'refunded' as const }
            : payment
        )
      );
      
      toast.success('Payment refunded successfully');
      setRefundAlertOpen(false);
      setDialogOpen(false);
    }
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

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
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment History" 
        description="View and manage all your payment transactions"
      />
      
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="text-left text-sm text-gray-500">
                <tr className="border-b">
                  <th className="pb-3 pl-2 pr-3 font-medium">Patient</th>
                  <th className="pb-3 px-3 font-medium">Amount</th>
                  <th className="pb-3 px-3 font-medium">Type</th>
                  <th className="pb-3 px-3 font-medium">Date</th>
                  <th className="pb-3 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No payments found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr 
                      key={payment.id} 
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handlePaymentClick(payment)}
                    >
                      <td className="py-4 pl-2 pr-3">
                        <div className="font-medium text-gray-900">{payment.patientName}</div>
                        <div className="text-xs text-gray-500">{payment.patientEmail}</div>
                      </td>
                      <td className="py-4 px-3 font-medium">
                        £{payment.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-3 text-gray-700">
                        {capitalizeFirstLetter(payment.type)}
                      </td>
                      <td className="py-4 px-3 text-gray-500">
                        {payment.date}
                      </td>
                      <td className="py-4 px-3">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <PaymentDetailDialog
        payment={selectedPayment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRefund={handleRefundInitiate}
      />

      <AlertDialog open={refundAlertOpen} onOpenChange={setRefundAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPayment && (
                <>
                  Are you sure you want to issue a refund for £{selectedPayment.amount.toFixed(2)} to {selectedPayment.patientName}? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefundConfirm} className="bg-red-500 hover:bg-red-600">
              Yes, Refund Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PaymentHistoryPage;
