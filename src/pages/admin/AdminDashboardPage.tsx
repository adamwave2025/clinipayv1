
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, RefreshCcw, DollarSign } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { RecentClinicsTable } from '@/components/admin/RecentClinicsTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboardPage = () => {
  const { stats, loading } = useAdminStats();
  const { loading: authLoading } = useAuth();

  const StatCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon 
  }: {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
  }) => (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {change}
            </span>
          </div>
          <div className="bg-gradient-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show global loading while auth is loading
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
            change={`${stats.totalClinics > 0 ? '+3 this month' : 'No new clinics'}`}
            trend="up"
            icon={<Users className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="Total Payments" 
            value={formatCurrency(stats.totalPayments)} 
            change={`${stats.paymentsChange > 0 ? '+' : ''}${stats.paymentsChange}% from last month`}
            trend={stats.paymentsChange > 0 ? 'up' : 'down'}
            icon={<CreditCard className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="Total Refunds" 
            value={formatCurrency(stats.totalRefunds)} 
            change={`${stats.refundsChange > 0 ? '+' : ''}${stats.refundsChange}% from last month`}
            trend={stats.refundsChange < 0 ? 'down' : 'up'}
            icon={<RefreshCcw className="h-5 w-5 text-white" />}
          />
          <StatCard 
            title="CliniPay Revenue" 
            value={formatCurrency(stats.clinipayRevenue)} 
            change={`${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}% from last month`}
            trend={stats.revenueChange > 0 ? 'up' : 'down'}
            icon={<DollarSign className="h-5 w-5 text-white" />}
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
