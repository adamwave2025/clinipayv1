
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

  // Adapt formData to match the expected SendLinkForm interface
  const adaptedFormData = {
    patientName: formData.patientName,
    patientEmail: formData.patientEmail,
    patientPhone: formData.patientPhone,
    selectedLink: formData.paymentLinkId || '',
    customAmount: formData.customAmount ? String(formData.customAmount) : '',
    message: formData.message || '',
    startDate: formData.paymentDate || new Date()
  };

  // Adapt handleSelectChange to match expected signature
  const handleSelectValue = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'paymentLinkId',
        value
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    handleSelectChange(syntheticEvent);
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Request Payment" 
        description="Send a reusable payment link or payment plan to your patient"
      />
      
      <Card className="card-shadow max-w-2xl mx-auto">
        <CardContent className="p-6">
          <SendLinkForm 
            isLoading={isLoading}
            paymentLinks={regularLinks}
            paymentPlans={paymentPlans}
            isLoadingLinks={isLoadingLinks}
            formData={adaptedFormData}
            isPaymentPlan={isPaymentPlan}
            onFormChange={handleChange}
            onSelectChange={handleSelectValue}
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
