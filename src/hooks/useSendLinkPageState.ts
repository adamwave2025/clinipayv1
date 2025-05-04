import { useState, useEffect } from 'react';
import { Patient } from '@/hooks/usePatients';
import { PaymentLink } from '@/types/payment';
import { addDays, addWeeks, addMonths, format, isSameDay } from 'date-fns';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { usePaymentLinkSender } from '@/hooks/usePaymentLinkSender';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { recordPaymentPlanActivity } from '@/services/PaymentScheduleService';

export interface SendLinkFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  message: string;
  startDate: Date;
}

export function useSendLinkPageState() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { paymentLinks: allPaymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const [regularLinks, setRegularLinks] = useState<PaymentLink[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentLink[]>([]);
  const { isLoading, sendPaymentLink } = usePaymentLinkSender();
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false); // New state for payment plan scheduling
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<SendLinkFormData>({
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

  const createPaymentRequest = async (
    clinicId: string, 
    patientId: string | null, 
    paymentLinkId: string,
    message: string,
    status: 'sent' | 'scheduled' = 'sent'
  ) => {
    try {
      // Create a payment request entry
      const { data: paymentRequest, error: requestError } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone,
          payment_link_id: paymentLinkId,
          message: message,
          status: status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating payment request:', requestError);
        throw new Error('Failed to create payment request');
      }

      return paymentRequest;
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  };

  const sendImmediatePayment = async (
    paymentScheduleEntry: any,
    clinicId: string,
    patientId: string | null,
    selectedLink: PaymentLink,
    formattedAddress: string,
    existingPaymentRequestId?: string
  ) => {
    try {
      let paymentRequest;

      // Use existing payment request if provided, otherwise create a new one
      if (existingPaymentRequestId) {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('id', existingPaymentRequestId)
          .single();

        if (error) {
          throw new Error(`Error retrieving existing payment request: ${error.message}`);
        }
        paymentRequest = data;
        
        // Ensure the request status is 'sent'
        if (paymentRequest.status !== 'sent') {
          const { error: updateError } = await supabase
            .from('payment_requests')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', existingPaymentRequestId);
            
          if (updateError) {
            throw new Error(`Error updating payment request status: ${updateError.message}`);
          }
        }

        console.log('Using existing payment request:', paymentRequest.id);
      } else {
        // Create a new payment request
        paymentRequest = await createPaymentRequest(
          clinicId,
          patientId,
          selectedLink.id,
          `Payment ${paymentScheduleEntry.payment_number} of ${paymentScheduleEntry.total_payments} is due.`
        );
        console.log('Created new payment request:', paymentRequest.id);
      }

      // Update the corresponding schedule entry to link it to the payment request
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({ 
          payment_request_id: paymentRequest.id,
          status: 'sent', // CHANGED: Using 'sent' status instead of 'processed'
          updated_at: new Date().toISOString()
        })
        .eq('payment_number', paymentScheduleEntry.payment_number)
        .eq('payment_link_id', selectedLink.id)
        .eq('patient_id', patientId);

      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw new Error(`Failed to update payment schedule: ${updateError.message}`);
      }

      // Send notification
      const notificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      if (notificationMethod.email || notificationMethod.sms) {
        // Get clinic data
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', clinicId)
          .single();

        if (clinicError) {
          console.error('Error getting clinic data:', clinicError);
          throw new Error('Failed to get clinic data');
        }

        const notificationPayload = {
          notification_type: "payment_request",
          notification_method: notificationMethod,
          patient: {
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone
          },
          payment: {
            reference: paymentRequest.id,
            amount: paymentScheduleEntry.amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment/${paymentRequest.id}`,
            message: `Payment ${paymentScheduleEntry.payment_number} of ${paymentScheduleEntry.total_payments} is due.`
          },
          clinic: {
            name: clinicData.clinic_name || "Your healthcare provider",
            email: clinicData.email,
            phone: clinicData.phone,
            address: formattedAddress
          }
        };

        // Queue notification
        const { error: notifError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_request',
            payload: notificationPayload,
            recipient_type: 'patient',
            payment_id: paymentRequest.id,
            status: 'pending'
          });

        if (notifError) {
          console.error('Error queuing notification:', notifError);
          throw new Error(`Failed to queue notification: ${notifError.message}`);
        }

        // Process the notification
        await supabase.functions.invoke('process-notification-queue');
      }

      return true;
    } catch (error) {
      console.error('Error sending immediate payment:', error);
      return false;
    }
  };

  const handleSchedulePaymentPlan = async () => {
    // Prevent multiple form submissions
    if (isSchedulingPlan) {
      return { success: false };
    }

    try {
      setIsSchedulingPlan(true);
      
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
      
      if (!selectedLink || !selectedLink.paymentPlan || !selectedLink.paymentCount) {
        toast.error('Invalid payment plan selected');
        setIsSchedulingPlan(false);
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
        setIsSchedulingPlan(false);
        return { success: false };
      }

      const clinicId = userData.clinic_id;

      // Generate payment schedule
      const schedule = generatePaymentSchedule(
        formData.startDate,
        selectedLink.paymentCycle || 'monthly', 
        selectedLink.paymentCount, 
        selectedLink.amount
      );

      // Format clinic address for notifications
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (clinicError) {
        console.error('Error getting clinic data:', clinicError);
        toast.error('Failed to schedule payment plan');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      const addressParts = [];
      if (clinicData.address_line_1) addressParts.push(clinicData.address_line_1);
      if (clinicData.address_line_2) addressParts.push(clinicData.address_line_2);
      if (clinicData.city) addressParts.push(clinicData.city);
      if (clinicData.postcode) addressParts.push(clinicData.postcode);
      const formattedAddress = addressParts.join(", ");

      // Check if first payment is due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstPaymentDate = new Date(schedule[0].due_date);
      const isFirstPaymentToday = isSameDay(firstPaymentDate, today);
      
      // Create first payment request only if it's due today
      let firstPaymentRequest = null;
      if (isFirstPaymentToday) {
        try {
          firstPaymentRequest = await createPaymentRequest(
            clinicId,
            selectedPatient?.id || null,
            selectedLink.id,
            `Payment 1 of ${selectedLink.paymentCount} is due.`
          );
          console.log('Created first payment request for today:', firstPaymentRequest.id);
        } catch (reqError) {
          console.error('Error creating first payment request:', reqError);
          // Continue with scheduling even if the request creation fails
        }
      }
      
      // Create schedule entries
      const scheduleEntries = schedule.map((entry, index) => {
        // The first payment should be marked as 'sent' and linked to the payment request if it's due today
        const isFirst = index === 0;
        const status = (isFirst && isFirstPaymentToday) ? 'sent' : 'pending'; // CHANGED: Using 'sent' status instead of 'processed'
        
        return {
          clinic_id: clinicId,
          patient_id: selectedPatient?.id,
          payment_link_id: selectedLink.id,
          payment_request_id: (isFirst && isFirstPaymentToday && firstPaymentRequest) ? firstPaymentRequest.id : null,
          amount: entry.amount,
          due_date: entry.due_date,
          payment_number: entry.payment_number,
          total_payments: entry.total_payments,
          payment_frequency: entry.payment_frequency,
          status: status
        };
      });

      // Insert all schedule entries
      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .insert(scheduleEntries);

      if (scheduleError) {
        console.error('Error creating payment schedule:', scheduleError);
        toast.error('Failed to schedule payment plan');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      // Record the "Plan Created" activity
      const userId = (await supabase.auth.getUser()).data.user?.id;
      await recordPaymentPlanActivity(
        selectedPatient?.id || null,
        selectedLink.id,
        clinicId,
        'create',
        {
          start_date: format(formData.startDate, 'yyyy-MM-dd'),
          installments: selectedLink.paymentCount,
          frequency: selectedLink.paymentCycle || 'monthly',
          total_amount: selectedLink.amount * selectedLink.paymentCount,
          installment_amount: selectedLink.amount,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail
        },
        userId
      );

      // If the first payment is due today, send it immediately using the existing request ID
      if (isFirstPaymentToday && firstPaymentRequest) {
        const firstPayment = schedule[0];
        const sentSuccessfully = await sendImmediatePayment(
          firstPayment,
          clinicId,
          selectedPatient?.id || null,
          selectedLink,
          formattedAddress,
          firstPaymentRequest.id // Pass the existing payment request ID
        );
        
        if (sentSuccessfully) {
          toast.success('Payment plan scheduled and first payment sent immediately');
        } else {
          toast.success('Payment plan scheduled, but there was an issue sending the first payment');
        }
      } else {
        toast.success('Payment plan scheduled successfully');
      }

      resetForm();
      setShowConfirmation(false);
      setIsSchedulingPlan(false);
      return { success: true };
    } catch (error) {
      console.error('Error scheduling payment plan:', error);
      toast.error('Failed to schedule payment plan');
      setIsSchedulingPlan(false);
      return { success: false };
    }
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
    isSchedulingPlan, // Expose the new state
    handleChange,
    handleSelectChange,
    handleDateChange,
    handlePatientSelect,
    handleCreateNew,
    handleSubmit,
    handleSendPaymentLink
  };
}
