
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, RefreshCcw, BadgePoundSterling } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { RecentClinicsTable } from '@/components/admin/RecentClinicsTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatUserInputCurrency } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import StatCard from '@/components/common/StatCard';
import { toast } from 'sonner';

const AdminDashboardPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { stats, loading, refetchStats } = useAdminStats(dateRange);
  const { loading: authLoading } = useAuth();

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      toast.info(`Filtering data from ${range.from.toLocaleDateString()} to ${range.to.toLocaleDateString()}`);
    } else if (!range) {
      toast.info('Date filter cleared');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <PageHeader 
        title="Admin Dashboard" 
        description="Platform overview and statistics"
      />
      
      <div className="mb-6 flex justify-end">
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          className="w-auto"
        />
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-shadow">
              <CardContent className="p-6 flex items-center justify-center h-[104px]">
                <LoadingSpinner size="sm" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Clinics" 
            value={stats.totalClinics.toString()} 
            secondaryText={`${stats.totalClinics > 0 ? '+3 this month' : 'No new clinics'}`}
            icon={<Users className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="Total Payments" 
            value={formatCurrency(stats.totalPayments)} 
            secondaryText={`${stats.paymentsChange > 0 ? '+' : ''}${stats.paymentsChange}% from last period`}
            icon={<CreditCard className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="Total Refunds" 
            value={formatCurrency(stats.totalRefunds)} 
            secondaryText={`${stats.refundsChange > 0 ? '+' : ''}${stats.refundsChange}% from last period`}
            icon={<RefreshCcw className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="CliniPay Revenue" 
            value={formatUserInputCurrency(stats.clinipayRevenue)} 
            secondaryText={`${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}% from last period`}
            icon={<BadgePoundSterling className="h-5 w-5 text-white" />}
          />
        </div>
      )}
      
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Recent Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <RecentClinicsTable />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
