
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import DeletePlanDialog from '@/components/dashboard/payment-plans/DeletePlanDialog';
import EditPlanDialog from '@/components/dashboard/payment-plans/EditPlanDialog';
import ActivePlansTable from '@/components/dashboard/payment-plans/ActivePlansTable';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';

const PaymentPlansPage = () => {
  const navigate = useNavigate();
  const {
    paymentPlans,
    filteredPlans,
    isLoading,
    searchQuery,
    setSearchQuery,
    planToDelete,
    planToEdit,
    showDeleteDialog,
    setShowDeleteDialog,
    showEditDialog,
    setShowEditDialog,
    editFormData,
    handleEditPlan,
    handleDeletePlan,
    confirmDeletePlan,
    handleEditFormChange,
    saveEditedPlan
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
        {/* Active Plans Table */}
        <ActivePlansTable 
          isLoading={isLoading}
          plans={filteredPlans}
          onCreatePlanClick={handleCreatePlanClick}
          onViewPlanDetails={handleEditPlan}
        />
        
        {/* Filters */}
        <PaymentPlanFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeletePlanDialog 
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        planToDelete={planToDelete}
        onConfirmDelete={confirmDeletePlan}
      />

      {/* Edit Plan Dialog */}
      <EditPlanDialog 
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        formData={editFormData}
        onFormChange={handleEditFormChange}
        onSaveChanges={saveEditedPlan}
      />
    </DashboardLayout>
  );
};

export default PaymentPlansPage;
