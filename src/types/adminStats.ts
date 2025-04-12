
export interface AdminStats {
  totalClinics: number;
  totalPayments: number;
  totalRefunds: number;
  clinipayRevenue: number;
  paymentsChange: number;
  revenueChange: number;
  refundsChange: number;
}

export const defaultStats: AdminStats = {
  totalClinics: 0,
  totalPayments: 0,
  totalRefunds: 0,
  clinipayRevenue: 0,
  paymentsChange: 12.5, // Default placeholder values for trend
  revenueChange: 8.3,
  refundsChange: -2.1
};
