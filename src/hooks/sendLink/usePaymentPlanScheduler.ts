import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentLink } from '@/types/payment';
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
import { addToNotificationQueue } from '@/utils/notification-queue';

export function usePaymentPlanScheduler() {
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false);
  const { user } = useAuth();

  const handleSchedulePaymentPlan = async (
    patientId: string,
    formData: {
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      startDate: string;
      selectedLink: string;
      message: string;
    },
    selectedPlan: PaymentLink
  ) => {
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: 'Authentication required' };
    }

    setIsSchedulingPlan(true);
    console.log('Starting payment plan scheduling process...');

    try {
      // Get the clinic ID for the current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`Failed to get clinic information: ${userError.message}`);
      }

      if (!userData.clinic_id) {
        console.error('No clinic_id found for user:', user.id);
        throw new Error('No clinic associated with this user');
      }

      const clinicId = userData.clinic_id;
      console.log(`Using clinic ID: ${clinicId}`);

      // Get clinic details for the notification
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (clinicError) {
        console.error('Error fetching clinic data:', clinicError);
        throw new Error(`Failed to get clinic details: ${clinicError.message}`);
      }

      // Validate the payment frequency - fixed property name
      const paymentFrequency = selectedPlan.paymentCycle || 'monthly';
      if (!['weekly', 'bi-weekly', 'monthly'].includes(paymentFrequency)) {
        console.error('Invalid payment frequency:', paymentFrequency);
        throw new Error(`Invalid payment frequency: ${paymentFrequency}`);
      }

      // Calculate total amount and installment amount - fixed property names
      const totalAmount = selectedPlan.planTotalAmount || selectedPlan.amount || 0;
      const paymentCount = selectedPlan.paymentCount || 1;
      const installmentAmount = Math.floor(totalAmount / paymentCount);

      console.log('Payment plan details:', {
        totalAmount,
        paymentCount,
        installmentAmount,
        paymentFrequency
      });

      // Ensure valid dates and amounts
      if (!formData.startDate) {
        throw new Error('Start date is required');
      }

      if (totalAmount <= 0 || installmentAmount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Create the plan record
      console.log('Creating payment plan with start date:', formData.startDate);
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedPlan.id,
          title: selectedPlan.title || 'Payment Plan',
          description: selectedPlan.description || formData.message || 'Payment Plan',
          total_amount: totalAmount,
          installment_amount: installmentAmount,
          total_installments: paymentCount,
          paid_installments: 0,
          progress: 0,
          payment_frequency: paymentFrequency,
          start_date: formData.startDate,
          next_due_date: formData.startDate,
          status: 'pending',
          created_by: user.id
        })
        .select()
        .single();

      if (planError) {
        console.error('Error creating payment plan:', planError);
        throw new Error(`Failed to create payment plan: ${planError.message}`);
      }

      if (!planData) {
        throw new Error('Failed to create payment plan: No data returned');
      }

      const planId = planData.id;
      console.log('Payment plan created successfully:', planId);

      // Now create the payment schedule
      const schedulePromises = [];
      let currentDate = new Date(formData.startDate);

      for (let i = 1; i <= paymentCount; i++) {
        // Format date as ISO string but cut off the time part
        const dueDate = currentDate.toISOString().split('T')[0];

        console.log(`Creating installment ${i}/${paymentCount} due on ${dueDate}`);
        
        const scheduleItem = {
          plan_id: planId,
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedPlan.id,
          amount: installmentAmount,
          due_date: dueDate,
          payment_frequency: paymentFrequency,
          status: 'pending',
          payment_number: i,
          total_payments: paymentCount
        };
        
        schedulePromises.push(
          supabase
            .from('payment_schedule')
            .insert(scheduleItem)
            .select()
        );

        // Advance the date based on payment frequency
        switch (paymentFrequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'bi-weekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Wait for all schedule items to be created
      const scheduleResults = await Promise.all(schedulePromises);
      
      // Check for errors in creating schedule items
      const scheduleErrors = scheduleResults
        .filter(result => result.error)
        .map(result => result.error);
      
      if (scheduleErrors.length > 0) {
        console.error('Errors creating payment schedule items:', scheduleErrors);
        throw new Error(`Failed to create one or more schedule items`);
      }

      // Get the first payment schedule item for the initial payment request
      const firstPaymentSchedule = scheduleResults[0].data?.[0];
      
      if (!firstPaymentSchedule) {
        console.error('Failed to retrieve first payment schedule');
        throw new Error('Failed to create initial payment schedule');
      }
      
      console.log('⚠️ CRITICAL: First payment schedule created:', firstPaymentSchedule.id);

      // Now create a payment request for the first installment
      const { data: paymentRequestData, error: paymentRequestError } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedPlan.id,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone ? formData.patientPhone.replace(/\D/g, '') : null,
          status: 'sent',
          message: formData.message || `Payment plan: ${selectedPlan.title || 'Payment Plan'} - Installment 1 of ${paymentCount}`
        })
        .select()
        .single();

      if (paymentRequestError) {
        console.error('Error creating payment request:', paymentRequestError);
        throw new Error(`Failed to create payment request: ${paymentRequestError.message}`);
      }

      if (!paymentRequestData) {
        throw new Error('Failed to create payment request: No data returned');
      }

      console.log('⚠️ CRITICAL: Created payment request for first installment:', paymentRequestData.id);

      // Update the first payment schedule with the request ID AND SET STATUS TO SENT
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({ 
          payment_request_id: paymentRequestData.id,
          status: 'sent',  // Update status to 'sent' to match the payment request status
          updated_at: new Date().toISOString()
        })
        .eq('id', firstPaymentSchedule.id);

      if (updateError) {
        console.error('Error updating payment schedule with request ID:', updateError);
        // Non-fatal error, we can continue
      } else {
        console.log('Updated payment schedule with request ID and set status to sent');
      }

      // Create an activity record for this plan creation
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: selectedPlan.id,
          plan_id: planId,
          action_type: 'plan_created',
          performed_by_user_id: user.id,
          details: {
            plan_id: planId,
            total_amount: totalAmount,
            installment_amount: installmentAmount,
            payment_count: paymentCount,
            start_date: formData.startDate,
            payment_frequency: paymentFrequency
          }
        });

      if (activityError) {
        console.error('Error creating activity record:', activityError);
        // Non-fatal error, we can continue
      } else {
        console.log('Created activity record for plan creation');
      }

      // Now create and send the notification for the first payment
      // Use clinicNotificationData instead of clinicData to avoid name collision
      const { data: clinicNotificationData, error: clinicDataError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicDataError) {
        console.error('Error fetching clinic details for notification:', clinicDataError);
        toast.warning('Payment plan created, but notification might be delayed');
      } else {
        const formattedAddress = ClinicFormatter.formatAddress(clinicNotificationData);
        const notificationMethod: NotificationMethod = {
          email: !!formData.patientEmail,
          sms: !!formData.patientPhone
        };
        
        console.log('⚠️ CRITICAL: Creating notification for payment plan first installment');
        
        const notificationPayload: StandardNotificationPayload = {
          notification_type: "payment_request",
          notification_method: notificationMethod,
          patient: {
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone
          },
          payment: {
            reference: paymentRequestData.id,
            amount: installmentAmount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment/${paymentRequestData.id}`,
            message: `[PLAN] ${formData.message || `Payment plan: ${selectedPlan.title || 'Payment Plan'} - Installment 1 of ${paymentCount}`}`
          },
          clinic: {
            name: clinicNotificationData.clinic_name || "Your healthcare provider",
            email: clinicNotificationData.email,
            phone: clinicNotificationData.phone,
            address: formattedAddress
          }
        };
        
        console.log('⚠️ CRITICAL: Notification payload prepared for payment plan:', JSON.stringify(notificationPayload, null, 2));
        
        try {
          console.log('⚠️ CRITICAL: Adding payment plan notification to queue and calling webhook immediately...');
          
          const { success, error, webhook_success, webhook_error } = await addToNotificationQueue(
            'payment_request',
            notificationPayload,
            'patient',
            clinicId,
            paymentRequestData.id
          );

          if (!success) {
            console.error("⚠️ CRITICAL ERROR: Failed to queue payment plan notification:", error);
            toast.warning("Payment plan created, but notification delivery might be delayed");
          } else if (!webhook_success) {
            console.error("⚠️ CRITICAL ERROR: Failed to deliver notification via webhook:", webhook_error);
            toast.warning("Payment plan created, but notification delivery might be delayed");
          } else {
            console.log("⚠️ CRITICAL SUCCESS: Payment plan notification sent successfully");
          }
        } catch (notifyErr) {
          console.error("⚠️ CRITICAL ERROR: Exception during payment plan notification delivery:", notifyErr);
          toast.warning("Payment plan created, but there was an issue sending notifications");
        }
      }

      return { 
        success: true, 
        planId: planId,
        paymentRequestId: paymentRequestData.id
      };

    } catch (error: any) {
      console.error('Error in handleSchedulePaymentPlan:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to schedule payment plan'
      };
    } finally {
      setIsSchedulingPlan(false);
    }
  };

  return {
    handleSchedulePaymentPlan,
    isSchedulingPlan
  };
}
