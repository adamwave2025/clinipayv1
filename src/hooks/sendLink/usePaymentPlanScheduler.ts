
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { recordPaymentPlanActivity } from '@/services/PaymentScheduleService';
import { PaymentLink } from '@/types/payment';
import { SendLinkFormData } from './useSendLinkFormState';
import { useNavigate } from 'react-router-dom';

export function usePaymentPlanScheduler() {
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false);
  const navigate = useNavigate();

  const generatePaymentSchedule = (startDate: Date, frequency: string, count: number, amount: number) => {
    const schedule = [];
    let currentDate = new Date(startDate);
    
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
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        currentDate = newDate;
      } else if (frequency === 'bi-weekly') {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 14);
        currentDate = newDate;
      } else if (frequency === 'monthly') {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        currentDate = newDate;
      }
    }

    return schedule;
  };

  const createPaymentRequest = async (
    clinicId: string, 
    patientId: string | null, 
    paymentLinkId: string,
    message: string,
    status: 'sent' | 'scheduled' = 'sent',
    patientName: string,
    patientEmail: string,
    patientPhone: string
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
          patient_name: patientName,
          patient_email: patientEmail,
          patient_phone: patientPhone,
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
    patientId: string,
    selectedLink: PaymentLink,
    formattedAddress: string,
    patientName: string,
    patientEmail: string,
    patientPhone: string,
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
          `Payment ${paymentScheduleEntry.payment_number} of ${paymentScheduleEntry.total_payments} is due.`,
          'sent',
          patientName,
          patientEmail,
          patientPhone
        );
        console.log('Created new payment request:', paymentRequest.id);
      }

      // Log the current payment schedule entry for debugging
      console.log('Payment schedule entry being processed:', {
        paymentNumber: paymentScheduleEntry.payment_number,
        planId: paymentScheduleEntry.plan_id,
        linkId: selectedLink.id,
        patientId
      });

      // Update the corresponding schedule entry to link it to the payment request
      // CRITICAL FIX: Add plan_id filter to ensure we only update the specific plan's schedule entries
      const { error: updateError, data: updatedData } = await supabase
        .from('payment_schedule')
        .update({ 
          payment_request_id: paymentRequest.id,
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('payment_number', paymentScheduleEntry.payment_number)
        .eq('payment_link_id', selectedLink.id)
        .eq('patient_id', patientId)
        .eq('plan_id', paymentScheduleEntry.plan_id) // CRITICAL FIX: Added plan_id filter
        .select();

      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw new Error(`Failed to update payment schedule: ${updateError.message}`);
      }

      // Log the updated data for better debugging
      console.log('Updated payment schedule entries:', updatedData);

      // Send notification
      const notificationMethod = {
        email: !!patientEmail,
        sms: !!patientPhone
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
            name: patientName,
            email: patientEmail,
            phone: patientPhone
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

  const handleSchedulePaymentPlan = async (
    patientId: string,
    formData: SendLinkFormData,
    selectedLink: PaymentLink
  ) => {
    if (isSchedulingPlan) {
      console.log('Schedule already in progress, preventing duplicate submission');
      return { success: false };
    }

    try {
      setIsSchedulingPlan(true);
      console.log('Starting payment plan scheduling with patient ID:', patientId);
      
      if (!selectedLink || !selectedLink.paymentPlan || !selectedLink.paymentCount) {
        console.error('Invalid payment plan selected:', selectedLink);
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
          firstPaymentRequest = await createPaymentRequest(
            clinicId,
            patientId,
            selectedLink.id,
            `Payment 1 of ${selectedLink.paymentCount} is due.`,
            'sent',
            formData.patientName,
            formData.patientEmail,
            formData.patientPhone
          );
          console.log('Created first payment request for today:', firstPaymentRequest.id);
        } catch (reqError: any) {
          console.error('Error creating first payment request:', reqError);
          // Continue with plan creation even if first payment request fails
        }
      }
      
      // Create a new plan record in the plans table
      const totalAmount = selectedLink.amount * selectedLink.paymentCount;
      const firstPaymentDueDate = schedule[0].due_date;
      
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
        toast.error('Failed to schedule payment plan');
        setIsSchedulingPlan(false);
        return { success: false };
      }

      // Record the "Plan Created" activity
      try {
        await recordPaymentPlanActivity({
          planId: planData.id, 
          actionType: 'plan_created',
          details: {
            start_date: format(formData.startDate, 'yyyy-MM-dd'),
            installments: selectedLink.paymentCount,
            frequency: selectedLink.paymentCycle || 'monthly',
            total_amount: totalAmount,
            installment_amount: selectedLink.amount,
            patient_name: formData.patientName,
            patient_email: formData.patientEmail
          }
        });
      } catch (activityError: any) {
        console.error('Error recording plan activity:', activityError);
      }

      // If the first payment is due today, send it immediately but don't show a separate toast
      if (isFirstPaymentToday && firstPaymentRequest) {
        const firstPayment = schedule[0];
        
        try {
          const sentSuccessfully = await sendImmediatePayment(
            firstPayment,
            clinicId,
            patientId,
            selectedLink,
            formattedAddress,
            formData.patientName,
            formData.patientEmail,
            formData.patientPhone,
            firstPaymentRequest.id
          );
          
          if (!sentSuccessfully) {
            console.warn('First payment notification may not have been sent properly');
          }
        } catch (sendError: any) {
          console.error('Error sending first payment:', sendError);
          // Continue with success flow despite this error
        }
      }

      // No success toast here - we'll let the parent component handle that
      
      // Redirect to payment plans page with view=active parameter
      navigate('/dashboard/payment-plans?view=active');

      return { success: true };
    } catch (error: any) {
      console.error('Error scheduling payment plan:', error);
      toast.error(`Failed to schedule payment plan: ${error.message}`);
      return { success: false };
    } finally {
      setIsSchedulingPlan(false);
    }
  };

  return {
    isSchedulingPlan,
    handleSchedulePaymentPlan,
    sendImmediatePayment,
    createPaymentRequest
  };
}
