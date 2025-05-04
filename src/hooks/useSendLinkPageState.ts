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

  // Enhanced createOrGetPatient function with better error handling and verification
  const createOrGetPatient = async (): Promise<string | null> => {
    // Prevent concurrent calls to patient creation
    if (creatingPatientInProgress) {
      console.log('Patient creation already in progress, waiting...');
      // Wait a moment for the previous call to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      // If we have a patient ID already, return it
      if (selectedPatient?.id) {
        console.log('Patient was created during wait period:', selectedPatient.id);
        return selectedPatient.id;
      }
    }
    
    setCreatingPatientInProgress(true);
    console.log('Starting createOrGetPatient process');
    
    try {
      // Get the clinic id from the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError) {
        console.error('Error getting clinic ID:', userError);
        toast.error('Could not determine clinic ID');
        throw new Error('Could not determine clinic ID');
      }

      if (!userData?.clinic_id) {
        console.error('No clinic_id found for user');
        toast.error('No clinic associated with your account');
        throw new Error('No clinic associated with this user');
      }

      const clinicId = userData.clinic_id;
      console.log('Using clinic ID:', clinicId);
      
      // If we have a selected patient, verify it's complete and return their ID
      if (selectedPatient && selectedPatient.id) {
        console.log('Using existing selected patient:', selectedPatient.id);
        
        // Verify that selectedPatient has all required properties
        const requiredProps = ['id', 'name', 'email', 'phone', 'created_at', 'updated_at'];
        const isMissingProps = requiredProps.some(prop => !(prop in selectedPatient));
        
        if (isMissingProps) {
          console.log('Selected patient is missing properties, fetching complete patient record');
          
          // Fetch the complete patient record
          const { data: completePatient, error: fetchError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', selectedPatient.id)
            .single();
            
          if (fetchError) {
            console.error('Error fetching complete patient record:', fetchError);
            throw new Error('Could not get complete patient details');
          }
          
          if (completePatient) {
            // Update the selected patient with the complete record
            setSelectedPatient(completePatient);
          }
        }
        
        return selectedPatient.id;
      }
      
      // If we're creating a new patient, insert them into the database
      if (isCreatingNewPatient && formData.patientName && formData.patientEmail) {
        console.log('Creating new patient:', formData.patientName);
        
        // Check if patient with this email already exists to prevent duplicates
        const { data: existingPatient, error: lookupError } = await supabase
          .from('patients')
          .select('*')  // Select all fields to ensure we have a complete patient record
          .eq('clinic_id', clinicId)
          .eq('email', formData.patientEmail)
          .maybeSingle();
        
        if (lookupError) {
          console.error('Error checking for existing patient:', lookupError);
        }
        
        if (existingPatient) {
          console.log('Found existing patient with same email:', existingPatient.id);
          // Update selected patient reference with the complete Patient object
          setSelectedPatient(existingPatient);
          setIsCreatingNewPatient(false);
          return existingPatient.id;
        }
        
        // Create the patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone || null
          })
          .select('*')  // Select all fields to get the complete patient record
          .single();
        
        if (patientError) {
          console.error('Error creating patient:', patientError);
          toast.error('Could not create new patient');
          throw new Error(`Could not create new patient: ${patientError.message}`);
        }
        
        if (!newPatient || !newPatient.id) {
          console.error('Patient created but no ID returned');
          toast.error('Patient creation failed');
          throw new Error('Patient created but no ID returned');
        }
        
        console.log('Successfully created new patient with ID:', newPatient.id);
        
        // Update selected patient and return ID
        setSelectedPatient(newPatient);
        setIsCreatingNewPatient(false);
        
        // Verify the patient was actually created in the database to prevent race conditions
        let verificationAttempts = 0;
        const maxVerificationAttempts = 3;
        
        while (verificationAttempts < maxVerificationAttempts) {
          // Add a small delay to ensure DB consistency
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { data: verifiedPatient, error: verifyError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', newPatient.id)
            .single();
            
          if (verifiedPatient) {
            console.log('Successfully verified patient creation:', verifiedPatient.id);
            return verifiedPatient.id;
          }
          
          console.log(`Verification attempt ${verificationAttempts + 1} failed, retrying...`);
          verificationAttempts++;
        }
        
        if (verificationAttempts >= maxVerificationAttempts) {
          throw new Error('Could not verify patient creation after multiple attempts');
        }
        
        return newPatient.id;
      }
      
      console.log('No patient created or selected');
      return null;
    } catch (error: any) {
      console.error('Error in createOrGetPatient:', error);
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

  // Updated createPaymentRequest function with better error handling
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
      console.log('Schedule already in progress, preventing duplicate submission');
      return { success: false };
    }

    // Create a loading toast that we can update later
    const loadingToastId = toast.loading('Creating patient record and scheduling plan...');

    try {
      setIsSchedulingPlan(true);
      console.log('Starting payment plan scheduling process');
      
      const selectedLink = [...regularLinks, ...paymentPlans].find(link => link.id === formData.selectedLink);
      
      if (!selectedLink || !selectedLink.paymentPlan || !selectedLink.paymentCount) {
        console.error('Invalid payment plan selected:', selectedLink);
        toast.error('Invalid payment plan selected');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      console.log('Selected payment plan:', selectedLink);

      // Create or get patient ID first - CRITICAL STEP
      console.log('Creating or getting patient...');
      toast.dismiss(loadingToastId);
      const patientCreationToastId = toast.loading('Creating or updating patient record...');
      
      const patientId = await createOrGetPatient();
      toast.dismiss(patientCreationToastId);
      
      if (!patientId) {
        console.error('Could not obtain valid patient ID');
        toast.error('Could not create or find patient record');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      console.log('Using patient ID:', patientId);
      const planCreationToastId = toast.loading('Setting up payment plan...');

      // Get the clinic id from the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError) {
        console.error('Error getting clinic ID:', userError);
        toast.dismiss(planCreationToastId);
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
        toast.dismiss(planCreationToastId);
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
          toast.dismiss(planCreationToastId);
          const firstPaymentToastId = toast.loading('Creating first payment request...');
          firstPaymentRequest = await createPaymentRequest(
            clinicId,
            patientId, // Using validated patientId
            selectedLink.id,
            `Payment 1 of ${selectedLink.paymentCount} is due.`
          );
          toast.dismiss(firstPaymentToastId);
          console.log('Created first payment request for today:', firstPaymentRequest.id);
        } catch (reqError: any) {
          console.error('Error creating first payment request:', reqError);
          // Continue with scheduling even if the request creation fails
          toast.warning('Could not create first payment notification, but will continue scheduling plan');
        }
      }
      
      // Create a new plan record in the plans table
      const totalAmount = selectedLink.amount * selectedLink.paymentCount;
      
      // IMPORTANT: Set the next_due_date to the first payment's due date
      const firstPaymentDueDate = schedule[0].due_date;
      
      toast.dismiss(planCreationToastId);
      const finalToastId = toast.loading('Finalizing payment plan...');
      console.log('Creating plan record in database...');
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
          next_due_date: firstPaymentDueDate, // Set next_due_date to the first payment's due date
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (planError) {
        console.error('Error creating payment plan:', planError);
        toast.dismiss(finalToastId);
        toast.error(`Failed to create payment plan: ${planError.message}`);
        setIsSchedulingPlan(false);
        return { success: false };
      }

      console.log('Created plan record:', planData);
      
      if (!planData || !planData.id) {
        console.error('Plan created but no ID returned');
        toast.dismiss(finalToastId);
        toast.error('Payment plan creation failed');
        setIsSchedulingPlan(false);
        return { success: false };
      }
      
      // Create a timestamp to identify this batch of schedule entries
      const batchCreationTime = new Date().toISOString();
      
      // Create schedule entries
      const scheduleEntries = schedule.map((entry, index) => {
        // The first payment should be marked as 'sent' and linked to the payment request if it's due today
        const isFirst = index === 0;
        const status = (isFirst && isFirstPaymentToday) ? 'sent' : 'pending';
        
        return {
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedLink.id,
          plan_id: planData.id, // Link to the new plan
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

      console.log('Creating payment schedule entries...');
      // Insert all schedule entries
      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .insert(scheduleEntries);

      if (scheduleError) {
        console.error('Error creating payment schedule:', scheduleError);
        toast.dismiss(finalToastId);
        toast.error(`Failed to schedule payment plan: ${scheduleError.message}`);
        setIsSchedulingPlan(false);
        return { success: false };
      }

      // Record the "Plan Created" activity
      try {
        await recordPaymentPlanActivity(
          planData.id,  // Use plan ID as first parameter
          'create',     // Action type as second parameter
          {             // Details as third parameter
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
        // Non-critical error, continue without failing
      }

      // If the first payment is due today, send it immediately using the existing request ID
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
            firstPaymentRequest.id // Pass the existing payment request ID
          );
          
          toast.dismiss(sendPaymentToastId);
          if (sentSuccessfully) {
            toast.success('Payment plan scheduled and first payment sent immediately');
          } else {
            toast.success('Payment plan scheduled, but there was an issue sending the first payment');
          }
        } catch (sendError: any) {
          console.error('Error sending immediate payment:', sendError);
          toast.dismiss(sendPaymentToastId);
          toast.success('Payment plan scheduled successfully, but first payment notification failed');
        }
      } else {
        toast.dismiss(finalToastId);
        toast.success('Payment plan scheduled successfully');
      }

      resetForm();
      setShowConfirmation(false);
      setIsSchedulingPlan(false);
      return { success: true };
    } catch (error: any) {
      console.error('Error scheduling payment plan:', error);
      toast.dismiss(loadingToastId);
      toast.error(`Failed to schedule payment plan: ${error.message}`);
      setIsSchedulingPlan(false);
      return { success: false };
    }
  };

  const handleSendPaymentLink = async () => {
    if (isPaymentPlan) {
      await handleSchedulePaymentPlan();
    } else {
      // For regular payment links, create patient first if needed
      if (isCreatingNewPatient) {
        const patientId = await createOrGetPatient();
        if (!patientId) {
          toast.error('Could not create patient record');
          return;
        }
      }
      
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
