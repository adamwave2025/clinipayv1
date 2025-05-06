
import React from 'react';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';

const ManagePlansContent: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    plans,
    allPlans, // Get the unfiltered plans array
    isLoading,
    handleViewPlanDetails,
    handleCreatePlanClick
  } = useManagePlansContext();

  // Calculate the total number of plans from the unfiltered allPlans array
  const totalPlanCount = allPlans.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PaymentPlanFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      
      {/* Plans Table */}
      <ActivePlansTable 
        isLoading={isLoading}
        plans={plans}
        totalPlanCount={totalPlanCount} // Pass the total plan count
        onCreatePlanClick={handleCreatePlanClick}
        onViewPlanDetails={handleViewPlanDetails}
        statusFilter={statusFilter} // Pass the current status filter
      />
    </div>
  );
};

export default ManagePlansContent;
