
import React from 'react';
import { BadgePoundSterling, Calendar, RefreshCcw } from 'lucide-react';
import StatCardTrend from './StatCardTrend';
import { PaymentStats } from '@/types/payment';

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

const PaymentStatsCards = ({ stats }: PaymentStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCardTrend
        title="Today's Payments"
        value={`£${stats.totalReceivedToday.toFixed(2)}`}
        icon={<BadgePoundSterling className="h-5 w-5 text-white" />}
      />
      <StatCardTrend
        title="Pending Today"
        value={`£${stats.totalPendingToday.toFixed(2)}`}
        icon={<Calendar className="h-5 w-5 text-white" />}
      />
      <StatCardTrend
        title="Month Total"
        value={`£${stats.totalReceivedMonth.toFixed(2)}`}
        icon={<BadgePoundSterling className="h-5 w-5 text-white" />}
      />
      <StatCardTrend
        title="Month Refunded"
        value={`£${stats.totalRefundedMonth.toFixed(2)}`}
        icon={<RefreshCcw className="h-5 w-5 text-white" />}
      />
    </div>
  );
};

export default PaymentStatsCards;
