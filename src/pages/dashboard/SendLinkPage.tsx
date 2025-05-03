
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
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
    startDate: new Date(),
  });
  const [isPaymentPlan, setIsPaymentPlan] = useState(false);

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

  // Track if the selected link is a payment plan
  useEffect(() => {
    if (!formData.selectedLink) {
      setIsPaymentPlan(false);
      return;
    }
    
    const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
    setIsPaymentPlan(selectedLink?.paymentPlan || false);
  }, [formData.selectedLink, regularLinks, paymentPlans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, selectedLink: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, startDate: date }));
    }
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

  const validateForm = () => {
    if (!formData.patientName || !formData.patientEmail) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    if (!formData.selectedLink && !formData.customAmount) {
      toast.error('Please either select a payment option or enter a custom amount');
      return false;
    }
    
    if (formData.customAmount && (isNaN(Number(formData.customAmount)) || Number(formData.customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (formData.patientPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        toast.error('Please enter a valid phone number');
        return false;
      }
    }
    
    if (isPaymentPlan && !formData.startDate) {
      toast.error('Please select a start date for the payment plan');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowConfirmation(true);
  };

  const generatePaymentSchedule = (startDate: Date, frequency: string, count: number, amount: number) => {
    const schedule = [];
    let currentDate = startDate;
    
    // Use the full amount for each payment, not divided by count
    const paymentAmount = amount;

    for (let i = 1; i <= count; i++) {
      schedule.push({
        payment_number: i,
        total_payments: count,
        due_date: format(currentDate, 'yyyy-MM-dd'),
        amount: paymentAmount,
        payment_frequency: frequency
      });

      // Calculate next date based on frequency
      if (frequency === 'weekly') {
        currentDate = addWeeks(currentDate, 1);
      } else if (frequency === 'bi-weekly') {
        currentDate = addWeeks(currentDate, 2);
      } else if (frequency === 'monthly') {
        currentDate = addMonths(currentDate, 1);
      }
    }

    return schedule;
  };

  const handleSendPaymentLink = async () => {
    if (isPaymentPlan) {
      await handleSchedulePaymentPlan();
    } else {
      // Use existing functionality for regular payment links
      const result = await sendPaymentLink({ 
        formData, 
        paymentLinks: [...regularLinks, ...paymentPlans] 
      });
      
      if (result.success) {
        resetForm();
        setShowConfirmation(false); // Close the dialog after successful submission
      }
    }
  };

  const handleSchedulePaymentPlan = async () => {
    try {
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
      
      if (!selectedLink || !selectedLink.paymentPlan || !selectedLink.paymentCount) {
        toast.error('Invalid payment plan selected');
        return { success: false };
      }

      // Get the clinic id from the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError) {
        console.error('Error getting clinic ID:', userError);
        toast.error('Failed to schedule payment plan');
        return { success: false };
      }

      const clinicId = userData.clinic_id;

      // First create a payment request to get a reference
      const { data: paymentRequest, error: requestError } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone,
          payment_link_id: formData.selectedLink,
          message: formData.message,
          status: 'scheduled',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating payment request:', requestError);
        toast.error('Failed to schedule payment plan');
        return { success: false };
      }

      // Generate payment schedule
      const schedule = generatePaymentSchedule(
        formData.startDate,
        selectedLink.paymentCycle || 'monthly', 
        selectedLink.paymentCount, 
        selectedLink.amount
      );

      // Create schedule entries
      const scheduleEntries = schedule.map(entry => ({
        clinic_id: clinicId,
        patient_id: selectedPatient?.id,
        payment_link_id: selectedLink.id,
        payment_request_id: paymentRequest.id,
        amount: entry.amount,
        due_date: entry.due_date,
        payment_number: entry.payment_number,
        total_payments: entry.total_payments,
        payment_frequency: entry.payment_frequency,
      }));

      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .insert(scheduleEntries);

      if (scheduleError) {
        console.error('Error creating payment schedule:', scheduleError);
        toast.error('Failed to schedule payment plan');
        return { success: false };
      }

      toast.success('Payment plan scheduled successfully');
      resetForm();
      setShowConfirmation(false);
      return { success: true };
    } catch (error) {
      console.error('Error scheduling payment plan:', error);
      toast.error('Failed to schedule payment plan');
      return { success: false };
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      selectedLink: '',
      customAmount: '',
      message: '',
      startDate: new Date(),
    });
    setSelectedPatient(null);
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
        isPaymentPlan={isPaymentPlan}
        onConfirm={handleSendPaymentLink}
      />
    </DashboardLayout>
  );
};

export default SendLinkPage;
