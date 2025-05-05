
import React, { useState } from 'react';
import { PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { 
  ManagePlansProvider, 
  ManagePlansContent, 
  ManagePlansDialogs 
} from './manage-plans';
import { useManagePlansContext } from '@/contexts/ManagePlansContext';
import { DashboardDataProvider } from '@/components/dashboard/DashboardDataProvider';
import PaymentPlansTable from '@/components/dashboard/payment-plans/PaymentPlansTable';
import { Plan } from '@/utils/planTypes';
import { PaymentLink } from '@/types/payment';

// Adapter function to convert Plan objects to PaymentLink format
const convertPlansToPaymentLinks = (plans: Plan[]): PaymentLink[] => {
  return plans.map(plan => ({
    id: plan.id,
    title: plan.title || plan.planName || '',
    description: plan.description || '',
    amount: plan.installmentAmount,
    planTotalAmount: plan.totalAmount,
    paymentCount: plan.totalInstallments,
    paymentCycle: plan.paymentFrequency,
    type: 'payment_plan', // Adding the missing required field
    isRequest: false,
    status: plan.status,
    clinic: {
      id: plan.clinicId,
      name: '', // Default value, not displayed in table
      stripeStatus: ''
    },
    paymentPlan: true
  }));
};

const ManagePlansHeader: React.FC = () => {
  const { handleCreatePlanClick, handleViewPlansClick, isViewMode, setIsViewMode } = useManagePlansContext();
  
  return (
    <PageHeader 
      title="Payment Plans" 
      description="Create and manage payment plans for your patients"
      action={
        <div className="flex space-x-2">
          {isViewMode ? (
            <Button 
              className="btn-gradient flex items-center"
              onClick={handleCreatePlanClick}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="flex items-center"
              onClick={() => {
                handleViewPlansClick();
                setIsViewMode(true);
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          )}
        </div>
      }
    />
  );
};

const ManagePlansPageContent: React.FC = () => {
  const { isViewMode, plans, isLoading, searchQuery, setSearchQuery, handleCreatePlanClick } = useManagePlansContext();
  
  // Convert Plan[] to PaymentLink[] for the PaymentPlansTable
  const paymentLinksFormat = convertPlansToPaymentLinks(plans);
  
  return (
    <>
      <ManagePlansHeader />
      {isViewMode ? (
        <PaymentPlansTable
          filteredPlans={paymentLinksFormat}
          isLoading={isLoading}
          paymentPlans={paymentLinksFormat}
          onCreatePlanClick={handleCreatePlanClick}
          onEditPlan={() => {}}
          onDeletePlan={() => {}}
        />
      ) : (
        <ManagePlansContent />
      )}
      <ManagePlansDialogs />
    </>
  );
};

const ManagePlansPage: React.FC = () => {
  return (
    <DashboardLayout userType="clinic">
      <DashboardDataProvider>
        <ManagePlansProvider>
          <ManagePlansPageContent />
        </ManagePlansProvider>
      </DashboardDataProvider>
    </DashboardLayout>
  );
};

export default ManagePlansPage;
