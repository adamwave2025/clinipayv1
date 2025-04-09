
import React from 'react';
import { DollarSign, Calendar, RefreshCcw } from 'lucide-react';
import StatCardTrend from './StatCardTrend';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCardTrend
        title="Today's Payments"
        value={`£${stats.totalReceivedToday.toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5 text-white" />}
        trend="up"
        trendValue="4.3% from yesterday"
      />
      <StatCardTrend
        title="Pending Today"
        value={`£${stats.totalPendingToday.toFixed(2)}`}
        icon={<Calendar className="h-5 w-5 text-white" />}
        trend="none"
      />
      <StatCardTrend
        title="Month Total"
        value={`£${stats.totalReceivedMonth.toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5 text-white" />}
        trend="up"
        trendValue="12.5% from last month"
      />
      <StatCardTrend
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
