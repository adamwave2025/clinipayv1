
import { useState, useEffect } from 'react';
import { PaymentLink } from '@/types/payment';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useSendLinkFormState } from './sendLink/useSendLinkFormState';
import { usePatientManager } from './sendLink/usePatientManager';
import { usePaymentPlanScheduler } from './sendLink/usePaymentPlanScheduler';
import { usePaymentLinkSender } from './sendLink/usePaymentLinkSender';
import { useFormValidation } from './sendLink/useFormValidation';
import { toast } from 'sonner';

export function useSendLinkPageState() {
  const { paymentLinks: allPaymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const [regularLinks, setRegularLinks] = useState<PaymentLink[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [isPaymentPlan, setIsPaymentPlan] = useState(false);

  // Import all the hooks
  const formState = useSendLinkFormState();
  const patientManager = usePatientManager();
  const paymentPlanScheduler = usePaymentPlanScheduler();
  const paymentLinkSender = usePaymentLinkSender();
  const formValidation = useFormValidation();
  
  const { 
    formData, selectedPatient, isCreatingNewPatient, showConfirmation, 
    setShowConfirmation, handleChange, handleSelectChange, handleDateChange, 
    handlePatientSelect, handleCreateNew, resetForm
  } = formState;

  const { createOrGetPatient } = patientManager;
  const { handleSchedulePaymentPlan, isSchedulingPlan } = paymentPlanScheduler;
  const { isLoading, sendPaymentLink } = paymentLinkSender;
  const { validateForm } = formValidation;

  // Separate payment links and payment plans
  useEffect(() => {
    setRegularLinks(allPaymentLinks.filter(link => !link.paymentPlan));
    setPaymentPlans(allPaymentLinks.filter(link => link.paymentPlan));
  }, [allPaymentLinks]);

  // Track if the selected link is a payment plan
  useEffect(() => {
    if (!formData.selectedLink) {
      setIsPaymentPlan(false);
      return;
    }
    
    const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
    setIsPaymentPlan(selectedLink?.paymentPlan || false);
  }, [formData.selectedLink, regularLinks, paymentPlans]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }
    
    setShowConfirmation(true);
  };

  // Modified to handle the patient creation process first, then payment operations
  const handleSendPaymentLink = async () => {
    // Step 1: Create or get the patient first
    const patientId = await createOrGetPatient(
      formData.patientName,
      formData.patientEmail,
      formData.patientPhone,
      isCreatingNewPatient,
      selectedPatient
    );

    if (!patientId) {
      toast.error('Could not create or find patient record');
      return;
    }
    
    // Step 2: Now that we have a valid patient ID, proceed with the appropriate action
    if (isPaymentPlan) {
      // For payment plans, get the selected plan details
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
      if (!selectedLink) {
        toast.error('Selected payment plan not found');
        return;
      }
      
      // Schedule the plan with the verified patient ID
      const result = await handleSchedulePaymentPlan(patientId, formData, selectedLink);
      
      if (result.success) {
        resetForm();
        setShowConfirmation(false);
      }
    } else {
      // For regular payment links, use the link sender with the verified patient ID
      const result = await sendPaymentLink({ 
        formData, 
        paymentLinks: [...regularLinks, ...paymentPlans],
        patientId
      });
      
      if (result.success) {
        resetForm();
        setShowConfirmation(false);
      }
    }
  };

  // Find the selected payment option from either regular links or payment plans
  const selectedPaymentLink = formData.selectedLink 
    ? [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink) 
    : null;
  
  const paymentAmount = selectedPaymentLink 
    ? `£${selectedPaymentLink.amount.toFixed(2)}` 
    : (formData.customAmount ? `£${Number(formData.customAmount).toFixed(2)}` : '');

  return {
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
  };
}
