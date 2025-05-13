
import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePaymentLinks } from './usePaymentLinks';
import { useClinicData } from './useClinicData';
import { PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  message: string;
  paymentLinkId: string;
  customAmount: number | null;
  paymentDate: Date | null;
}

export function useSendLinkPageState() {
  const { clinicId } = useUnifiedAuth();
  const { links, loading, error, refresh } = usePaymentLinks();
  const { clinicData, isLoading: isLoadingClinic } = useClinicData();
  
  const [paymentLinkOptions, setPaymentLinkOptions] = useState<PaymentLink[]>([]);
  const [regularLinks, setRegularLinks] = useState<PaymentLink[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isPaymentPlan, setIsPaymentPlan] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    message: '',
    paymentLinkId: '',
    customAmount: null,
    paymentDate: null
  });

  // Process payment links when they're loaded
  useEffect(() => {
    if (!loading && links.length > 0) {
      // Separate regular links and payment plans
      const regLinks = links.filter(link => !link.paymentPlan);
      const planLinks = links.filter(link => link.paymentPlan);
      
      setRegularLinks(regLinks);
      setPaymentPlans(planLinks);
      setPaymentLinkOptions(regLinks);
      setIsLoadingLinks(false);
      
      // Auto-select first link if none selected and options exist
      if (!selectedLinkId && regLinks.length > 0) {
        setSelectedLinkId(regLinks[0].id);
        setFormData(prev => ({...prev, paymentLinkId: regLinks[0].id}));
      }
    } else {
      setIsLoadingLinks(loading);
    }
  }, [links, loading, selectedLinkId]);

  // Get the selected link object
  const selectedLink = paymentLinkOptions.find(link => link.id === selectedLinkId) || null;
  const selectedPaymentLink = selectedLink;
  
  // Calculate payment amount based on selection or custom amount
  const paymentAmount = formData.customAmount || (selectedLink?.amount || 0);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes (payment link selection)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'paymentLinkId') {
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === value);
      setIsPaymentPlan(!!selectedLink?.paymentPlan);
      setSelectedLinkId(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle date picker changes
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, paymentDate: date }));
  };

  // Handle patient selection from dropdown
  const handlePatientSelect = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patientName: patient.name,
      patientEmail: patient.email || '',
      patientPhone: patient.phone || ''
    }));
  };

  // Handle create new patient option
  const handleCreateNew = () => {
    setFormData(prev => ({
      ...prev,
      patientName: '',
      patientEmail: '',
      patientPhone: ''
    }));
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.patientName) {
      toast.error('Patient name is required');
      return;
    }
    
    if (!formData.patientEmail && !formData.patientPhone) {
      toast.error('Either email or phone is required');
      return;
    }
    
    if (!formData.paymentLinkId) {
      toast.error('Please select a payment link');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  // Send payment link after confirmation
  const handleSendPaymentLink = async () => {
    if (!clinicId || !selectedLink) {
      toast.error('Missing required information to send payment link');
      return;
    }
    
    try {
      const payload = {
        clinic_id: clinicId,
        payment_link_id: formData.paymentLinkId,
        patient_name: formData.patientName,
        patient_email: formData.patientEmail || null,
        patient_phone: formData.patientPhone || null,
        message: formData.message || null,
        custom_amount: formData.customAmount || null,
        status: 'sent'
      };
      
      const { data, error } = await supabase
        .from('payment_requests')
        .insert(payload)
        .select('id')
        .single();
        
      if (error) throw error;
      
      toast.success('Payment link sent successfully');
      setShowConfirmation(false);
      
      // Reset form
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        message: '',
        paymentLinkId: selectedLink.id,
        customAmount: null,
        paymentDate: null
      });
      
    } catch (err) {
      console.error('Error sending payment link:', err);
      toast.error('Failed to send payment link');
    }
  };

  return {
    paymentLinkOptions,
    selectedLinkId,
    setSelectedLinkId,
    selectedLink,
    isLoading: loading || isLoadingClinic,
    isLoadingLinks,
    error,
    clinicData,
    refresh,
    regularLinks,
    paymentPlans,
    formData,
    showConfirmation,
    setShowConfirmation,
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
