
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Calendar, DollarSign, RefreshCcw } from 'lucide-react';

interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

const PaymentStatsCards = ({ stats }: PaymentStatsCardsProps) => {
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    trend: 'up' | 'down' | 'none'; 
    trendValue?: string;
  }) => {
    return (
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
              
              {trend !== 'none' && trendValue && (
                <div className="flex items-center mt-1">
                  {trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            <div className="p-2 rounded-full bg-gradient-primary bg-opacity-10">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Today's Payments"
        value={`£${stats.totalReceivedToday.toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5 text-white" />}
        trend="up"
        trendValue="4.3% from yesterday"
      />
      <StatCard
        title="Pending Today"
        value={`£${stats.totalPendingToday.toFixed(2)}`}
        icon={<Calendar className="h-5 w-5 text-white" />}
        trend="none"
      />
      <StatCard
        title="Month Total"
        value={`£${stats.totalReceivedMonth.toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5 text-white" />}
        trend="up"
        trendValue="12.5% from last month"
      />
      <StatCard
        title="Month Refunded"
        value={`£${stats.totalRefundedMonth.toFixed(2)}`}
        icon={<RefreshCcw className="h-5 w-5 text-white" />}
        trend="down"
        trendValue="2.1% from last month"
      />
    </div>
  );
};

export default PaymentStatsCards;
