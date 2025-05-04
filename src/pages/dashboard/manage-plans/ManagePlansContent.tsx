
import React from 'react';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';

const ManagePlansContent: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    plans,
    isLoading,
    handleViewPlanDetails,
    handleCreatePlanClick
  } = useManagePlansContext();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PaymentPlanFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Plans Table */}
      <ActivePlansTable 
        isLoading={isLoading}
        plans={plans}
        onCreatePlanClick={handleCreatePlanClick}
        onViewPlanDetails={handleViewPlanDetails}
      />
    </div>
  );
};

export default ManagePlansContent;
