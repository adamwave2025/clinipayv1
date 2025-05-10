import React from 'react';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import PlanDetails from './PlanDetails';

const ManagePlansContent: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    plans,
    allPlans,
    isLoading,
    handleViewPlanDetails,
    handleCreatePlanClick,
    showPlanDetails,
    selectedPlan
  } = useManagePlansContext();

  // Calculate the total number of plans from the unfiltered allPlans array
  const totalPlanCount = allPlans.length;
  
  console.log('ManagePlansContent rendering with showPlanDetails:', showPlanDetails);
  console.log('ManagePlansContent has selectedPlan:', selectedPlan?.id);

  // If we're showing plan details, render the PlanDetails component
  if (showPlanDetails && selectedPlan) {
    console.log('Rendering PlanDetails component for plan:', selectedPlan.id);
    return <PlanDetails />;
  }

  // Otherwise, render the plans list
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
        totalPlanCount={totalPlanCount}
        onCreatePlanClick={handleCreatePlanClick}
        onViewPlanDetails={(plan) => {
          console.log('ActivePlansTable onViewPlanDetails called with plan:', plan.id);
          handleViewPlanDetails(plan);
        }}
        statusFilter={statusFilter}
      />
    </div>
  );
};

export default ManagePlansContent;
