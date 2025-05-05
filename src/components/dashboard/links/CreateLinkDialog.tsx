import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateLinkForm, LinkFormData } from '@/hooks/useCreateLinkForm';
import CreateLinkForm from './CreateLinkForm';
import LinkGeneratedDialog from './LinkGeneratedDialog';
import CreatePlanConfirmDialog from './CreatePlanConfirmDialog';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';
import { useState } from 'react';

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkCreated?: () => void;
  createPaymentLink: (data: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => Promise<{ 
    success: boolean; 
    paymentLink?: PaymentLink; 
    error?: string 
  }>;
  defaultPaymentType?: string;
}

const CreateLinkDialog = ({
  open,
  onOpenChange,
  onLinkCreated,
  createPaymentLink,
  defaultPaymentType = 'deposit'
}: CreateLinkDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPlanConfirmation, setShowPlanConfirmation] = useState(false);
  const [formData, setFormData] = useState<LinkFormData | null>(null);

  const handleLinkGenerated = (link: string, data: LinkFormData) => {
    setGeneratedLink(link);
    setFormData(data);
    setIsLoading(false);
    setShowConfirmation(true);
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setFormData(null);
    if (onLinkCreated) {
      onLinkCreated();
    }
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

  // Transform LinkFormData to PaymentLink format
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
    setIsLoading(true);
    setShowPlanConfirmation(false); // Close the confirmation dialog
    
    try {
      // Transform the form data to the expected PaymentLink format
      const paymentData = transformFormDataToPaymentLink(data);
      
      console.log('Sending payment data to API:', paymentData);
      const result = await createPaymentLink(paymentData);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to create payment link');
        setIsLoading(false);
        return result;
      }
      
      // For successful creation, call handleLinkGenerated with the URL
      if (result.paymentLink && result.paymentLink.url) {
        handleLinkGenerated(result.paymentLink.url, data);
      } else {
        // If we have a success but no URL (like for payment plans), create a mock URL
        const mockUrl = `#payment-plan-${Date.now()}`;
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

  const handleDialogClose = (open: boolean) => {
    if (!open && !showConfirmation) {
      // Reset dialog state when closing, but don't close if confirmation dialog is open
      setGeneratedLink(null);
      setFormData(null);
      setShowPlanConfirmation(false);
      setIsLoading(false);
      onOpenChange(open);
    } else if (open) {
      onOpenChange(open);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Create {defaultPaymentType === 'payment_plan' ? 'Payment Plan' : 'Reusable Link'}
            </DialogTitle>
          </DialogHeader>
          
          <CreateLinkForm 
            onLinkGenerated={handleLinkGenerated}
            isLoading={isLoading}
            onCreateLink={createPaymentLink}
            onSubmit={handleSubmitForm}
            defaultPaymentType={defaultPaymentType}
          />
        </DialogContent>
      </Dialog>

      <LinkGeneratedDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        generatedLink={generatedLink}
        formData={formData}
      />
      
      <CreatePlanConfirmDialog
        open={showPlanConfirmation}
        onOpenChange={setShowPlanConfirmation}
        formData={formData}
        onConfirm={() => formData && handleCreateLink(formData)}
        isLoading={isLoading}
      />
    </>
  );
};

export default CreateLinkDialog;
