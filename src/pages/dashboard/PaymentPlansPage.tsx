
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { useState } from 'react';
import ArchivePlanDialog from '@/components/dashboard/payment-plans/ArchivePlanDialog';
import { PaymentLink } from '@/types/payment';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

const PaymentPlansPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const {
    paymentPlans,
    filteredPlans,
    isLoading: plansLoading,
    searchQuery,
    setSearchQuery,
    isArchiveView,
    toggleArchiveView,
    handleArchivePlan,
    handleUnarchivePlan
  } = usePaymentPlans();

  // Add status filter state
  const [statusFilter, setStatusFilter] = React.useState('all');
  
  // State for archive dialog
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [planToArchive, setPlanToArchive] = useState<PaymentLink | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  
  // Determine if we're still loading any critical data
  const isLoading = authLoading || plansLoading;

  const handleCreatePlanClick = () => {
    navigate('/dashboard/manage-plans');
  };
  
  const onArchivePlan = (plan: PaymentLink) => {
    setPlanToArchive(plan);
    setShowArchiveDialog(true);
  };

  const confirmArchivePlan = async () => {
    if (!planToArchive) return;
    
    setIsArchiving(true);
    try {
      if (isArchiveView) {
        await handleUnarchivePlan(planToArchive);
      } else {
        await handleArchivePlan(planToArchive);
      }
    } finally {
      setIsArchiving(false);
      setShowArchiveDialog(false);
      setPlanToArchive(null);
    }
  };
  
  // Show enhanced loading state if auth or plans are still loading
  if (isLoading) {
    return (
      <DashboardLayout userType="clinic">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              {authLoading ? "Verifying your account..." : "Loading payment plans..."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment Plans" 
        description="View and manage payment plan templates for your patients"
        action={
          <div className="flex space-x-2">
            <Button 
              className="btn-gradient"
              onClick={handleCreatePlanClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </div>
        }
      />
      
      <div className="space-y-6">
        {/* Filters */}
        <PaymentPlanFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        {/* Payment Plans Table */}
        <PaymentPlansTable
          filteredPlans={filteredPlans}
          isLoading={isLoading}
          paymentPlans={paymentPlans}
          onCreatePlanClick={handleCreatePlanClick}
          onArchivePlan={onArchivePlan}
          onUnarchivePlan={onArchivePlan}
          isArchiveView={isArchiveView}
          toggleArchiveView={toggleArchiveView}
        />
        
        <ArchivePlanDialog
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
          onConfirm={confirmArchivePlan}
          plan={planToArchive}
          isLoading={isArchiving}
          isUnarchive={isArchiveView}
        />
      </div>
    </DashboardLayout>
  );
};

export default PaymentPlansPage;
