
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import SendLinkForm from '@/components/dashboard/payment-links/SendLinkForm';
import ConfirmationDialog from '@/components/dashboard/payment-links/ConfirmationDialog';
import { useSendLinkPageState } from '@/hooks/useSendLinkPageState';

const SendLinkPage = () => {
  const {
    showConfirmation,
    setShowConfirmation,
    isLoading,
    isLoadingLinks,
    regularLinks,
    paymentPlans,
    formData,
    isPaymentPlan,
    selectedPaymentLink,
    paymentAmount,
    isSchedulingPlan,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handlePatientSelect,
    handleCreateNew,
    handleSubmit,
    handleSendPaymentLink
  } = useSendLinkPageState();

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Request Payment" 
        description="Email a payment link directly to your patient"
      />
      
      <Card className="card-shadow max-w-2xl mx-auto">
        <CardContent className="p-6">
          <SendLinkForm 
            isLoading={isLoading}
            paymentLinks={regularLinks}
            paymentPlans={paymentPlans}
            isLoadingLinks={isLoadingLinks}
            formData={formData}
            isPaymentPlan={isPaymentPlan}
            onFormChange={handleChange}
            onSelectChange={handleSelectChange}
            onDateChange={handleDateChange}
            onPatientSelect={handlePatientSelect}
            onCreateNew={handleCreateNew}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        formData={formData}
        paymentAmount={paymentAmount}
        selectedPaymentLink={selectedPaymentLink}
        isLoading={isLoading}
        isSchedulingPlan={isSchedulingPlan}
        isPaymentPlan={isPaymentPlan}
        onConfirm={handleSendPaymentLink}
      />
    </DashboardLayout>
  );
};

export default SendLinkPage;
