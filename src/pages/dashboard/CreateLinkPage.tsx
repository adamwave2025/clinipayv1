
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import CreateLinkForm, { LinkFormData } from '@/components/dashboard/links/CreateLinkForm';
import LinkGeneratedDialog from '@/components/dashboard/links/LinkGeneratedDialog';
import CreatePlanConfirmDialog from '@/components/dashboard/links/CreatePlanConfirmDialog';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';

const CreateLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPlanConfirmation, setShowPlanConfirmation] = useState(false);
  const [formData, setFormData] = useState<LinkFormData | null>(null);
  const { createPaymentLink } = usePaymentLinks();

  const handleLinkGenerated = (link: string, data: LinkFormData) => {
    setGeneratedLink(link);
    setFormData(data);
    setIsLoading(false);
    setShowConfirmation(true);
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setFormData(null);
  };

  const handleSubmitForm = (data: LinkFormData) => {
    setFormData(data);
    
    // If it's a payment plan, show confirmation dialog first
    if (data.paymentPlan) {
      setShowPlanConfirmation(true);
    } else {
      // For regular links, proceed directly
      handleCreateLink(data);
    }
  };

  const handleCreateLink = async (data: any) => {
    setIsLoading(true);
    setShowPlanConfirmation(false); // Close the confirmation dialog
    
    const result = await createPaymentLink(data);
    
    if (!result.success) {
      setIsLoading(false);
    }
    
    return result;
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Create Payment" 
        description="Generate a secure payment link or create a payment plan"
      />
      
      <CreateLinkForm 
        onLinkGenerated={handleLinkGenerated}
        isLoading={isLoading}
        onCreateLink={handleCreateLink}
        onSubmit={handleSubmitForm}
      />

      <LinkGeneratedDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        generatedLink={generatedLink}
        formData={formData}
        onReset={resetForm}
      />
      
      <CreatePlanConfirmDialog
        open={showPlanConfirmation}
        onOpenChange={setShowPlanConfirmation}
        formData={formData}
        onConfirm={() => formData && handleCreateLink(formData)}
        isLoading={isLoading}
      />
    </DashboardLayout>
  );
};

export default CreateLinkPage;
