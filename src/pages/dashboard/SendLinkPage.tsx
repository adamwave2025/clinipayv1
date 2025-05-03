
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { Patient } from '@/hooks/usePatients';
import { usePaymentLinkSender } from '@/hooks/usePaymentLinkSender';
import SendLinkForm from '@/components/dashboard/payment-links/SendLinkForm';
import ConfirmationDialog from '@/components/dashboard/payment-links/ConfirmationDialog';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';

const SendLinkPage = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { paymentLinks: allPaymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const [regularLinks, setRegularLinks] = useState<PaymentLink[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const { isLoading, sendPaymentLink } = usePaymentLinkSender();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    selectedLink: '',
    customAmount: '',
    message: '',
  });

  // Separate payment links and payment plans
  useEffect(() => {
    setRegularLinks(allPaymentLinks.filter(link => !link.paymentPlan));
    setPaymentPlans(allPaymentLinks.filter(link => link.paymentPlan));
  }, [allPaymentLinks]);

  // Update form when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        patientName: selectedPatient.name,
        patientEmail: selectedPatient.email || '',
        patientPhone: selectedPatient.phone || ''
      }));
    }
  }, [selectedPatient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, selectedLink: value }));
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    
    if (!patient) {
      // Keep the existing name if we're creating a new patient
      setFormData(prev => ({
        ...prev,
        patientEmail: '',
        patientPhone: '',
      }));
    }
  };

  const handleCreateNew = (searchTerm: string) => {
    setSelectedPatient(null);
    // Update the form with the search term as the patient name
    setFormData(prev => ({
      ...prev,
      patientName: searchTerm,
      patientEmail: '',
      patientPhone: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.patientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.selectedLink && !formData.customAmount) {
      toast.error('Please either select a payment option or enter a custom amount');
      return;
    }
    
    if (formData.customAmount && (isNaN(Number(formData.customAmount)) || Number(formData.customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (formData.patientPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    setShowConfirmation(true);
  };

  const handleSendPaymentLink = async () => {
    // Combine regular links and payment plans for the sender function
    const result = await sendPaymentLink({ 
      formData, 
      paymentLinks: [...regularLinks, ...paymentPlans] 
    });
    
    if (result.success) {
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        selectedLink: '',
        customAmount: '',
        message: '',
      });
      setShowConfirmation(false);
    }
  };

  // Find the selected payment option from either regular links or payment plans
  const selectedPaymentLink = formData.selectedLink 
    ? [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink) 
    : null;
  
  const paymentAmount = selectedPaymentLink 
    ? `£${selectedPaymentLink.amount.toFixed(2)}` 
    : (formData.customAmount ? `£${Number(formData.customAmount).toFixed(2)}` : '');

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
            onFormChange={handleChange}
            onSelectChange={handleSelectChange}
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
        onConfirm={handleSendPaymentLink}
      />
    </DashboardLayout>
  );
};

export default SendLinkPage;
