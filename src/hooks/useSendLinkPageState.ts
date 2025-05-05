import { useState, useEffect } from 'react';
import { PaymentLink } from '@/types/payment';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useSendLinkFormState } from './sendLink/useSendLinkFormState';
import { usePatientManager } from './sendLink/usePatientManager';
import { usePaymentPlanScheduler } from './sendLink/usePaymentPlanScheduler';
import { usePaymentLinkSender } from './sendLink/usePaymentLinkSender';
import { useFormValidation } from './sendLink/useFormValidation';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

export function useSendLinkPageState() {
  const { paymentLinks: allPaymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const [regularLinks, setRegularLinks] = useState<PaymentLink[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [isPaymentPlan, setIsPaymentPlan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const { createOrGetPatient, creatingPatientInProgress } = patientManager;
  const { handleSchedulePaymentPlan, isSchedulingPlan } = paymentPlanScheduler;
  const { isLoading: isSendingPaymentLink, sendPaymentLink } = paymentLinkSender;
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

  // Modified to create patient first, then handle payment actions
  const handleSendPaymentLink = async () => {
    // Prevent concurrent processing
    if (isProcessing || creatingPatientInProgress || isSchedulingPlan || isSendingPaymentLink) {
      toast.warning('Another operation is in progress');
      return;
    }
    
    setIsProcessing(true);
    
    const loadingToast = toast.loading('Processing payment request...');
    
    try {
      console.log('Starting payment link sending process...');
      console.log('Form data:', {
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        isCreatingNewPatient,
        selectedPatient: selectedPatient?.id
      });
      
      // Step 1: Create or get the patient first - this is the critical step
      const patientId = await createOrGetPatient(
        formData.patientName,
        formData.patientEmail,
        formData.patientPhone,
        isCreatingNewPatient,
        selectedPatient
      );

      if (!patientId) {
        console.error('Failed to create or get patient');
        toast.dismiss(loadingToast);
        toast.error('Could not create or find patient record');
        setIsProcessing(false);
        return;
      }
      
      console.log('Successfully obtained patientId:', patientId);
      
      // Step 2: Now that we have a valid patient ID, proceed with the appropriate action
      if (isPaymentPlan) {
        // For payment plans, get the selected plan details
        const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
        if (!selectedLink) {
          toast.dismiss(loadingToast);
          toast.error('Selected payment plan not found');
          setIsProcessing(false);
          return;
        }
        
        // Schedule the plan with the verified patient ID
        toast.dismiss(loadingToast); // Dismiss the generic loading toast
        const result = await handleSchedulePaymentPlan(patientId, formData, selectedLink);
        
        if (result.success) {
          toast.success(`Payment plan scheduled successfully for ${formData.patientName}`, {
            description: `Plan: ${selectedLink.title || 'Payment Plan'}`
          });
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
        
        // Find the selected payment link for the success message
        const selectedLink = formData.selectedLink ? 
          [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink) : 
          null;
          
        // Use formatCurrency for proper amount formatting
        const formattedAmount = selectedLink ? 
          formatCurrency(selectedLink.amount) : 
          (formData.customAmount ? formatCurrency(Number(formData.customAmount)) : 'unknown amount');
          
        const linkTitle = selectedLink ? selectedLink.title : 'Custom payment';
        
        toast.dismiss(loadingToast); // Dismiss the generic loading toast
        
        if (result.success) {
          toast.success(`Payment request sent to ${formData.patientName}`, {
            description: `${linkTitle}: ${formattedAmount}`
          });
          resetForm();
          setShowConfirmation(false);
        }
      }
    } catch (error: any) {
      console.error('Error in handleSendPaymentLink:', error);
      toast.dismiss(loadingToast);
      toast.error(`Failed to process request: ${error.message}`);
    } finally {
      setIsProcessing(false);
      if (toast.dismiss) toast.dismiss(loadingToast);
    }
  };

  // Find the selected payment option from either regular links or payment plans
  const selectedPaymentLink = formData.selectedLink 
    ? [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink) 
    : null;
  
  const paymentAmount = selectedPaymentLink 
    ? formatCurrency(selectedPaymentLink.amount)
    : (formData.customAmount ? formatCurrency(Number(formData.customAmount)) : '');

  return {
    showConfirmation,
    setShowConfirmation,
    isLoading: isProcessing || creatingPatientInProgress || isSendingPaymentLink || isSchedulingPlan,
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
