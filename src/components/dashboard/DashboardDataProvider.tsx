
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { usePayments } from '@/hooks/usePayments';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'; 
import { supabase } from '@/integrations/supabase/client';
import { getUserClinicId } from '@/utils/userUtils';

interface DashboardContextType {
  recentPayments: any[];
  paymentLinks: any[];
  paymentStats: any;
  isLoading: boolean;
  refreshData: () => void;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardDataProvider');
  }
  return context;
};

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({ children }) => {
  const { user, clinicId } = useUnifiedAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook dependencies are managed through the clinic ID from UnifiedAuth
  const { payments: recentPayments, loading: paymentsLoading, refresh: refreshPayments, error: paymentsError } = usePayments();
  const { links: paymentLinks, loading: linksLoading, refresh: refreshLinks, error: linksError } = usePaymentLinks();
  const { stats: paymentStats, loading: statsLoading, refresh: refreshStats, error: statsError } = usePaymentStats();

  const isLoading = paymentsLoading || linksLoading || statsLoading || !isInitialized;

  // Combine errors if any exist
  useEffect(() => {
    if (paymentsError || linksError || statsError) {
      setError(paymentsError || linksError || statsError);
    } else {
      setError(null);
    }
  }, [paymentsError, linksError, statsError]);

  // Initialize when the component mounts
  useEffect(() => {
    if (user && clinicId) {
      setIsInitialized(true);
    }
  }, [user, clinicId]);

  const refreshData = () => {
    if (!user || !clinicId) {
      console.log('[DASHBOARD] Cannot refresh - no user or clinic ID');
      return;
    }
    
    console.log('[DASHBOARD] Refreshing all dashboard data');
    refreshPayments();
    refreshLinks();
    refreshStats();
  };

  return (
    <DashboardContext.Provider
      value={{
        recentPayments,
        paymentLinks,
        paymentStats,
        isLoading,
        refreshData,
        error
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
