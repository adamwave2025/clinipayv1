
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';

const PaymentPlansPage = () => {
  const navigate = useNavigate();
  const {
    paymentPlans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    isArchiveView,
    toggleArchiveView,
    handleArchivePlan,
    handleUnarchivePlan
  } = usePaymentPlans();

  // Add status filter state
  const [statusFilter, setStatusFilter] = React.useState('all');

  const handleCreatePlanClick = () => {
    navigate('/dashboard/manage-plans');
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Payment Plans" 
        description="View and manage active payment plans for your patients"
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
        <PaymentPlansTable
          filteredPlans={filteredPlans}
          isLoading={isLoading}
          paymentPlans={paymentPlans}
          onArchivePlan={handleArchivePlan}
          onUnarchivePlan={handleUnarchivePlan}
          isArchiveView={isArchiveView}
          toggleArchiveView={toggleArchiveView}
        />
        
        {/* Filters */}
        <PaymentPlanFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
    </DashboardLayout>
  );
};

export default PaymentPlansPage;
