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
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false);
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
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
  const [creatingPatientInProgress, setCreatingPatientInProgress] = useState(false);

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
      setIsCreatingNewPatient(false);
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
    setIsCreatingNewPatient(false);
    
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
    setIsCreatingNewPatient(true);
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

  // Simplified function to create or get patient - focused on completion before returning
  const createOrGetPatient = async (): Promise<string | null> => {
    // If we already have a patient with an ID, return it immediately
    if (selectedPatient?.id) {
      console.log('Using existing selected patient:', selectedPatient.id);
      return selectedPatient.id;
    }
    
    // Prevent concurrent patient creation
    if (creatingPatientInProgress) {
      toast.error('Patient creation already in progress');
      return null;
    }
    
    setCreatingPatientInProgress(true);
    const patientLoadingToast = toast.loading('Creating patient record...');
    
    try {
      // Get the clinic ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !userData?.clinic_id) {
        toast.dismiss(patientLoadingToast);
        toast.error('Could not determine clinic ID');
        return null;
      }

      const clinicId = userData.clinic_id;
      
      // If we're creating a new patient, do that now - return early if we fail
      if (isCreatingNewPatient && formData.patientName && formData.patientEmail) {
        console.log('Creating new patient:', formData.patientName);
        
        // Check for existing patient with this email
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('email', formData.patientEmail)
          .maybeSingle();
        
        if (existingPatient) {
          console.log('Found existing patient with same email:', existingPatient.id);
          setSelectedPatient(existingPatient);
          setIsCreatingNewPatient(false);
          toast.dismiss(patientLoadingToast);
          toast.success('Found existing patient record');
          return existingPatient.id;
        }
        
        // Create the new patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone || null
          })
          .select('*')
          .single();
        
        if (patientError || !newPatient) {
          toast.dismiss(patientLoadingToast);
          toast.error('Could not create new patient');
          return null;
        }
        
        console.log('Successfully created new patient with ID:', newPatient.id);
        
        // Verify patient creation by fetching it again
        const { data: verifiedPatient } = await supabase
          .from('patients')
          .select('*')
          .eq('id', newPatient.id)
          .single();
          
        if (!verifiedPatient) {
          toast.dismiss(patientLoadingToast);
          toast.error('Could not verify patient creation');
          return null;
        }
        
        // Update the selected patient state
        setSelectedPatient(newPatient);
        setIsCreatingNewPatient(false);
        
        toast.dismiss(patientLoadingToast);
        toast.success('Patient created successfully');
        return newPatient.id;
      }
      
      toast.dismiss(patientLoadingToast);
      return null;
    } catch (error: any) {
      console.error('Error in createOrGetPatient:', error);
      toast.dismiss(patientLoadingToast);
      toast.error(`Patient error: ${error.message}`);
      return null;
    } finally {
      setCreatingPatientInProgress(false);
    }
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
    console.log('Creating payment request:', { clinicId, patientId, paymentLinkId, status });
    
    try {
      if (!patientId) {
        console.error('Cannot create payment request without patient ID');
        throw new Error('Patient ID is required');
      }
      
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
        throw new Error(`Failed to create payment request: ${requestError.message}`);
      }

      if (!paymentRequest) {
        throw new Error('Payment request creation failed - no data returned');
      }

      console.log('Successfully created payment request:', paymentRequest.id);
      return paymentRequest;
    } catch (error: any) {
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
          patientId, // Using validated patientId
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

  // Simplified handleSchedulePaymentPlan that assumes patient is already created
  const handleSchedulePaymentPlan = async (patientId: string) => {
    if (isSchedulingPlan) {
      console.log('Schedule already in progress, preventing duplicate submission');
      return { success: false };
    }

    const loadingToastId = toast.loading('Scheduling payment plan...');

    try {
      setIsSchedulingPlan(true);
      console.log('Starting payment plan scheduling with patient ID:', patientId);
      
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
      
      if (!selectedLink || !selectedLink.paymentPlan || !selectedLink.paymentCount) {
        console.error('Invalid payment plan selected:', selectedLink);
        toast.dismiss(loadingToastId);
        toast.error('Invalid payment plan selected');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      // Get the clinic id from the user - we know patient ID is valid now
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !userData?.clinic_id) {
        toast.dismiss(loadingToastId);
        toast.error('Failed to get clinic information');
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
        toast.dismiss(loadingToastId);
        toast.error('Failed to get clinic information');
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
          toast.dismiss(loadingToastId);
          const firstPaymentToastId = toast.loading('Creating first payment request...');
          firstPaymentRequest = await createPaymentRequest(
            clinicId,
            patientId,
            selectedLink.id,
            `Payment 1 of ${selectedLink.paymentCount} is due.`
          );
          toast.dismiss(firstPaymentToastId);
          console.log('Created first payment request for today:', firstPaymentRequest.id);
        } catch (reqError: any) {
          console.error('Error creating first payment request:', reqError);
          toast.warning('Could not create first payment notification, but will continue scheduling plan');
        }
      }
      
      // Create a new plan record in the plans table
      const totalAmount = selectedLink.amount * selectedLink.paymentCount;
      const firstPaymentDueDate = schedule[0].due_date;
      
      toast.dismiss(loadingToastId);
      const finalToastId = toast.loading('Finalizing payment plan...');
      
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedLink.id,
          title: selectedLink.title || 'Payment Plan',
          description: selectedLink.description,
          status: 'pending',
          total_amount: totalAmount,
          installment_amount: selectedLink.amount,
          total_installments: selectedLink.paymentCount,
          paid_installments: 0,
          payment_frequency: selectedLink.paymentCycle || 'monthly',
          progress: 0,
          start_date: format(formData.startDate, 'yyyy-MM-dd'),
          next_due_date: firstPaymentDueDate,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (planError || !planData) {
        toast.dismiss(finalToastId);
        toast.error('Failed to create payment plan');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      console.log('Created plan record:', planData);
      
      // Create a timestamp to identify this batch of schedule entries
      const batchCreationTime = new Date().toISOString();
      
      // Create schedule entries
      const scheduleEntries = schedule.map((entry, index) => {
        const isFirst = index === 0;
        const status = (isFirst && isFirstPaymentToday) ? 'sent' : 'pending';
        
        return {
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedLink.id,
          plan_id: planData.id,
          payment_request_id: (isFirst && isFirstPaymentToday && firstPaymentRequest) ? firstPaymentRequest.id : null,
          amount: entry.amount,
          due_date: entry.due_date,
          payment_number: entry.payment_number,
          total_payments: entry.total_payments,
          payment_frequency: entry.payment_frequency,
          status: status,
          created_at: batchCreationTime,
          updated_at: batchCreationTime
        };
      });

      // Insert all schedule entries
      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .insert(scheduleEntries);

      if (scheduleError) {
        toast.dismiss(finalToastId);
        toast.error('Failed to schedule payment plan');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      // Record the "Plan Created" activity
      try {
        await recordPaymentPlanActivity(
          planData.id,
          'create',
          {
            start_date: format(formData.startDate, 'yyyy-MM-dd'),
            installments: selectedLink.paymentCount,
            frequency: selectedLink.paymentCycle || 'monthly',
            total_amount: totalAmount,
            installment_amount: selectedLink.amount,
            patient_name: formData.patientName,
            patient_email: formData.patientEmail
          }
        );
      } catch (activityError: any) {
        console.error('Error recording plan activity:', activityError);
      }

      // If the first payment is due today, send it immediately
      if (isFirstPaymentToday && firstPaymentRequest) {
        toast.dismiss(finalToastId);
        const sendPaymentToastId = toast.loading('Sending first payment notification...');
        const firstPayment = schedule[0];
        
        try {
          const sentSuccessfully = await sendImmediatePayment(
            firstPayment,
            clinicId,
            patientId,
            selectedLink,
            formattedAddress,
            firstPaymentRequest.id
          );
          
          toast.dismiss(sendPaymentToastId);
          if (sentSuccessfully) {
            toast.success('Payment plan scheduled and first payment sent immediately');
          } else {
            toast.success('Payment plan scheduled, but there was an issue sending the first payment');
          }
        } catch (sendError: any) {
          toast.dismiss(sendPaymentToastId);
          toast.success('Payment plan scheduled successfully, but first payment notification failed');
        }
      } else {
        toast.dismiss(finalToastId);
        toast.success('Payment plan scheduled successfully');
      }

      resetForm();
      setShowConfirmation(false);
      return { success: true };
    } catch (error: any) {
      console.error('Error scheduling payment plan:', error);
      toast.dismiss(loadingToastId);
      toast.error(`Failed to schedule payment plan: ${error.message}`);
      return { success: false };
    } finally {
      setIsSchedulingPlan(false);
    }
  };

  // Modified to handle the patient creation process first, then payment operations
  const handleSendPaymentLink = async () => {
    // Step 1: Create or get the patient first
    let patientId: string | null = null;
    
    // If we need to create a patient or verify their ID
    if (isCreatingNewPatient || !selectedPatient?.id) {
      patientId = await createOrGetPatient();
      if (!patientId) {
        toast.error('Could not create or find patient record');
        return;
      }
    } else if (selectedPatient?.id) {
      // We already have a valid patient ID
      patientId = selectedPatient.id;
    }
    
    // Step 2: Now that we have a valid patient ID, proceed with the appropriate action
    if (isPaymentPlan) {
      // For payment plans, call the schedule function with the patient ID
      await handleSchedulePaymentPlan(patientId);
    } else {
      // For regular payment links, use existing functionality
      const result = await sendPaymentLink({ 
        formData, 
        paymentLinks: [...regularLinks, ...paymentPlans] 
      });
      
      if (result.success) {
        resetForm();
        setShowConfirmation(false);
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
    setIsCreatingNewPatient(false);
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
