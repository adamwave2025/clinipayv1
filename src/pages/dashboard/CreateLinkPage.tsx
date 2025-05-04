
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import CreateLinkForm, { LinkFormData } from '@/components/dashboard/links/CreateLinkForm';
import LinkGeneratedDialog from '@/components/dashboard/links/LinkGeneratedDialog';
import CreatePlanConfirmDialog from '@/components/dashboard/links/CreatePlanConfirmDialog';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';

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
    console.log('Form submitted with data:', data);
    setFormData(data);
    
    // If it's a payment plan, show confirmation dialog first
    if (data.paymentPlan) {
      setShowPlanConfirmation(true);
    } else {
      // For regular links, proceed directly
      handleCreateLink(data);
    }
  };

  // Transform LinkFormData to PaymentLink format
  // Ensure we convert decimal amounts to cents for storage
  const transformFormDataToPaymentLink = (data: LinkFormData): Omit<PaymentLink, "id" | "url" | "createdAt" | "isActive"> => {
    // Parse amount as float and multiply by 100 to convert to cents
    const amountInCents = Math.round(parseFloat(data.amount) * 100);
    
    // Calculate plan total amount in cents if it's a payment plan
    const planTotalAmountInCents = data.paymentPlan 
      ? amountInCents * Number(data.paymentCount) 
      : undefined;
    
    return {
      title: data.paymentTitle,
      amount: amountInCents,
      type: data.paymentType,
      description: data.description,
      paymentPlan: data.paymentPlan,
      paymentCount: data.paymentPlan ? Number(data.paymentCount) : undefined,
      paymentCycle: data.paymentPlan ? data.paymentCycle : undefined,
      planTotalAmount: planTotalAmountInCents
    };
  };

  const handleCreateLink = async (data: LinkFormData) => {
    console.log('Creating link with data:', data);
    setIsLoading(true);
    setShowPlanConfirmation(false); // Close the confirmation dialog
    
    try {
      // Transform the form data to the expected PaymentLink format
      // This now handles converting display amounts to cents
      const paymentData = transformFormDataToPaymentLink(data);
      
      console.log('Sending payment data to API:', paymentData);
      const result = await createPaymentLink(paymentData);
      
      console.log('Create payment link result:', result);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to create payment link');
        setIsLoading(false);
        return result;
      }
      
      // For successful creation, call handleLinkGenerated with the URL
      if (result.paymentLink && result.paymentLink.url) {
        console.log('Payment link created successfully:', result.paymentLink);
        handleLinkGenerated(result.paymentLink.url, data);
      } else {
        // If we have a success but no URL (like for payment plans), create a mock URL
        // This ensures the success dialog still shows
        const mockUrl = `#payment-plan-${Date.now()}`;
        console.log('Created payment plan, using mock URL:', mockUrl);
        handleLinkGenerated(mockUrl, data);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error in handleCreateLink:', error);
      toast.error('An error occurred while creating the payment link');
      setIsLoading(false);
      return { success: false, error: error.message };
    }
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
        onCreateLink={createPaymentLink}
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
