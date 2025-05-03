
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import PaymentPlanFilters from '@/components/dashboard/payment-plans/PaymentPlanFilters';
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import DeletePlanDialog from '@/components/dashboard/payment-plans/DeletePlanDialog';
import EditPlanDialog from '@/components/dashboard/payment-plans/EditPlanDialog';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';

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

  const handleCreatePlanClick = () => {
    navigate('/dashboard/create-link');
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Manage Payment Plans" 
        description="View, edit and manage all your payment plans"
        action={
          <Button 
            className="btn-gradient"
            onClick={handleCreatePlanClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Button>
        }
      />
      
      <div className="space-y-6">
        {/* Filters */}
        <PaymentPlanFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Plans Table */}
        <PaymentPlansTable 
          filteredPlans={filteredPlans}
          isLoading={isLoading}
          paymentPlans={paymentPlans}
          onCreatePlanClick={handleCreatePlanClick}
          onEditPlan={handleEditPlan}
          onDeletePlan={handleDeletePlan}
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
