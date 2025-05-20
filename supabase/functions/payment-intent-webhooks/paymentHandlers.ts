import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateUUID } from './utils.ts';
import { PatientService } from './patientService.ts';  // New import

// Helper function to get the actual Stripe fee from a payment
async function getStripeFee(paymentIntent: any, stripe: any): Promise<number> {
  try {
    // Get the charge ID from the payment intent
    const chargeId = paymentIntent.latest_charge;
    
    if (!chargeId) {
      console.error('No charge ID found on payment intent');
      return 0;
    }
    
    console.log(`Retrieving charge details for charge: ${chargeId}`);
    
    // Get the charge object
    const charge = await stripe.charges.retrieve(chargeId);
    
    if (!charge || !charge.balance_transaction) {
      console.error('No balance transaction found on charge');
      return 0;
    }
    
    console.log(`Retrieving balance transaction for: ${charge.balance_transaction}`);
    
    // Get the balance transaction which contains the fee details
    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction
    );
    
    // Extract the fee amount
    const stripeFee = balanceTransaction.fee || 0;
    console.log(`Stripe fee retrieved: ${stripeFee}`);
    
    return stripeFee;
  } catch (error) {
    console.error('Error retrieving Stripe fee:', error);
    return 0; // Return 0 if there's an error to avoid breaking payment processing
  }
}

export async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: SupabaseClient) {
  console.log(`Processing successful payment: ${paymentIntent.id}`);
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    console.log('Payment intent metadata:', JSON.stringify(metadata, null, 2));
    
    // Check if this payment is for a payment schedule (installment payment)
    const paymentScheduleId = metadata.payment_schedule_id;
    const planId = metadata.planId;
    
    // Handle payment schedule payment (installment payment)
    if (paymentScheduleId && planId) {
      console.log(`Payment is for payment schedule ID: ${paymentScheduleId}, plan ID: ${planId}`);
      return await handleInstallmentPayment(paymentIntent, supabase, paymentScheduleId, planId);
    }
    
    // Normal payment processing (non-installment)
    return await handleStandardPayment(paymentIntent, supabase);
  } catch (error) {
    console.error(`Error processing payment intent ${paymentIntent.id}:`, error);
    throw error;
  }
}

async function handleInstallmentPayment(paymentIntent: any, supabase: SupabaseClient, paymentScheduleId: string, planId: string) {
  console.log(`Processing installment payment for schedule ID: ${paymentScheduleId}`);
  
  // Extract metadata
  const metadata = paymentIntent.metadata || {};
  const clinicId = metadata.clinicId;
  const patientName = metadata.patientName;
  const patientEmail = metadata.patientEmail;
  const patientPhone = metadata.patientPhone || null;
  const paymentLinkId = metadata.paymentLinkId || null;
  const platformFeePercent = metadata.platformFeePercent || '3';
  const paymentReference = metadata.paymentReference || `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Calculate fees
  const amount = paymentIntent.amount;
  const platformFeeAmount = Math.round((parseFloat(platformFeePercent) / 100) * amount);
  
  // Get the Stripe client from index.ts
  const stripe = paymentIntent._stripe;
  
  // Get the actual Stripe fee
  const stripeFee = await getStripeFee(paymentIntent, stripe);
  
  // Calculate net amount using the actual Stripe fee
  const netAmount = amount - stripeFee - platformFeeAmount;
  
  try {
    console.log('Creating payment record for installment payment');
    
    // Begin transaction
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        clinic_id: clinicId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        amount_paid: amount,
        paid_at: new Date().toISOString(),
        payment_link_id: paymentLinkId,
        payment_ref: paymentReference,
        stripe_payment_id: paymentIntent.id,
        status: 'paid',
        net_amount: netAmount,
        platform_fee: platformFeeAmount,
        stripe_fee: stripeFee, // Use actual Stripe fee
        payment_schedule_id: paymentScheduleId
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw paymentError;
    }
    
    console.log('Payment record created:', payment?.id);
    
    // Retrieve payment schedule details to get payment_request_id if available
    const { data: scheduleData, error: scheduleGetError } = await supabase
      .from('payment_schedule')
      .select('payment_request_id')
      .eq('id', paymentScheduleId)
      .single();
      
    if (scheduleGetError) {
      console.error('Error getting payment schedule data:', scheduleGetError);
      // Continue processing - this is non-critical
    }
    
    // Update payment request status if it exists
    if (scheduleData?.payment_request_id) {
      console.log(`Found payment request ID: ${scheduleData.payment_request_id}, updating status`);
      
      const { error: requestUpdateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_id: payment?.id
        })
        .eq('id', scheduleData.payment_request_id);
        
      if (requestUpdateError) {
        console.error('Error updating payment request:', requestUpdateError);
        // Non-critical error, continue
      } else {
        console.log(`Updated payment request ${scheduleData.payment_request_id} status to 'paid'`);
      }
    }
    
    // Update payment schedule status to 'paid'
    const { error: scheduleError } = await supabase
      .from('payment_schedule')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentScheduleId);
      
    if (scheduleError) {
      console.error('Error updating payment schedule:', scheduleError);
      throw scheduleError;
    }
    
    console.log(`Updated payment schedule ${paymentScheduleId} status to 'paid'`);
    
    // MODIFIED: Count actual paid installments from payment_schedule table
    const { count: paidInstallments, error: countError } = await supabase
      .from('payment_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('status', 'paid');
      
    if (countError) {
      console.error('Error counting paid installments:', countError);
      throw countError;
    }

    // Get plan details to calculate progress correctly
    const { data: planData, error: planFetchError } = await supabase
      .from('plans')
      .select('total_installments')
      .eq('id', planId)
      .single();
      
    if (planFetchError) {
      console.error('Error fetching plan details:', planFetchError);
      throw planFetchError;
    }
    
    // Calculate new values
    const progress = Math.round((paidInstallments / planData.total_installments) * 100);
    
    // Determine if all installments are paid
    const isCompleted = paidInstallments >= planData.total_installments;
    
    // Update plan
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({
        paid_installments: paidInstallments,
        progress: progress,
        status: isCompleted ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
        // Update next due date to the next unpaid installment
        next_due_date: isCompleted ? null : undefined
      })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan details:', planUpdateError);
      throw planUpdateError;
    }
    
    // If not all installments are paid, update the next_due_date to the next unpaid installment
    if (!isCompleted) {
      // Find the next unpaid installment
      const { data: nextPayment, error: nextPaymentError } = await supabase
        .from('payment_schedule')
        .select('due_date')
        .eq('plan_id', planId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .single();
        
      if (nextPayment && !nextPaymentError) {
        // Update plan's next due date
        await supabase
          .from('plans')
          .update({
            next_due_date: nextPayment.due_date
          })
          .eq('id', planId);
          
        console.log(`Updated plan ${planId} next due date to ${nextPayment.due_date}`);
      }
    }
    
    // Try to resolve patient ID for consistency with payment records
    let patientId = payment?.patient_id;
    
    // If patient ID is not set in the payment record (by trigger), try to find/create it
    if (!patientId && (patientEmail || patientPhone)) {
      try {
        patientId = await PatientService.findOrCreatePatient(
          supabase,
          patientName,
          patientEmail,
          patientPhone,
          clinicId
        );
        
        if (patientId) {
          console.log(`Resolved patient ID: ${patientId} for payment record`);
          
          // Update payment record with patient_id if it wasn't set by the trigger
          await supabase
            .from('payments')
            .update({ patient_id: patientId })
            .eq('id', payment?.id);
        }
      } catch (patientErr) {
        console.error("Error resolving patient ID:", patientErr);
        // Non-critical, continue processing
      }
    }
    
    // Record payment activity - CHANGED ACTION TYPE HERE
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: patientId, // Now using the resolved patient ID
        clinic_id: clinicId,
        action_type: 'card_payment_processed', // Changed from 'installment_payment_received'
        plan_id: planId,
        details: {
          amount: amount,
          paymentId: payment?.id,
          paymentReference,
          installmentNumber: paidInstallments,
          totalInstallments: planData.total_installments,
          progress: progress
        }
      });
    
    console.log(`Installment payment processing complete for payment schedule ${paymentScheduleId}`);
    
    // Queue notification for payment success
    try {
      console.log('Queueing payment success notification');
      
      // Get clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }
      
      // Queue notifications for payment success
      const patientPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: !!patientEmail,
          sms: !!patientPhone
        },
        patient: {
          name: patientName || 'Patient',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: payment?.id ? `https://clinipay.co.uk/payment-receipt/${payment.id}` : null,
          message: "Your payment was successful"
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your healthcare provider',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: notifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: patientPayload,
          payment_id: payment?.id,
          recipient_type: 'patient'
        });
        
      if (notifyError) {
        console.error(`Error queueing patient notification: ${notifyError.message}`);
      } else {
        console.log(`Successfully queued payment success notification for patient`);
      }
      
      // Queue clinic notification
      const clinicPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: clinicData?.email_notifications ?? true,
          sms: clinicData?.sms_notifications ?? false
        },
        patient: {
          name: patientName || 'Anonymous',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: payment?.id ? `https://clinipay.co.uk/payment-receipt/${payment.id}` : null,
          message: "Payment received successfully"
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your clinic',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: clinicNotifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: clinicPayload,
          payment_id: payment?.id,
          recipient_type: 'clinic'
        });
        
      if (clinicNotifyError) {
        console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
      } else {
        console.log(`Successfully queued payment notification for clinic`);
      }
      
    } catch (notifyErr) {
      console.error(`Error in notification processing: ${notifyErr.message}`);
      // Don't throw, just log the error
    }
    
    return {
      success: true,
      paymentId: payment?.id,
      message: `Payment recorded successfully for installment`
    };
  } catch (error) {
    console.error('Error processing installment payment:', error);
    throw error;
  }
}

async function handleStandardPayment(paymentIntent: any, supabase: SupabaseClient) {
  // Extract metadata
  const metadata = paymentIntent.metadata || {};
  const clinicId = metadata.clinicId;
  const patientName = metadata.patientName;
  const patientEmail = metadata.patientEmail;
  const patientPhone = metadata.patientPhone || null;
  const paymentLinkId = metadata.paymentLinkId || null;
  const requestId = metadata.requestId || null;
  const platformFeePercent = metadata.platformFeePercent || '3';
  const paymentReference = metadata.paymentReference || `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Calculate fees
  const amount = paymentIntent.amount;
  const platformFeeAmount = Math.round((parseFloat(platformFeePercent) / 100) * amount);
  
  // Get the Stripe client from index.ts
  const stripe = paymentIntent._stripe;
  
  // Get the actual Stripe fee
  const stripeFee = await getStripeFee(paymentIntent, stripe);
  
  // Calculate net amount using the actual Stripe fee
  const netAmount = amount - stripeFee - platformFeeAmount;
  
  console.log(`Processing standard payment for clinic ${clinicId}, amount: ${amount}p, reference: ${paymentReference}`);
  console.log(`Fees - Platform fee: ${platformFeeAmount}p, Stripe fee: ${stripeFee}p, Net amount: ${netAmount}p`);
  
  try {
    // NEW: Variables to store payment link details
    let paymentLinkType: string | null = null;
    let paymentLinkTitle: string | null = null;

    // NEW: If this payment is linked to a payment request or payment link, fetch link details
    if (requestId) {
      console.log(`Payment has requestId: ${requestId}, fetching associated payment link details`);
      
      // Get payment link details via the request
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .select(`payment_link_id`)
        .eq('id', requestId)
        .maybeSingle();
        
      if (!requestError && requestData && requestData.payment_link_id) {
        console.log(`Found payment_link_id from request: ${requestData.payment_link_id}`);
        
        // Fetch the payment link type and title
        const { data: linkData, error: linkError } = await supabase
          .from('payment_links')
          .select('type, title')
          .eq('id', requestData.payment_link_id)
          .maybeSingle();
          
        if (!linkError && linkData) {
          paymentLinkType = linkData.type;
          paymentLinkTitle = linkData.title;
          console.log(`Retrieved payment link type: ${paymentLinkType}, title: ${paymentLinkTitle}`);
        } else {
          console.error('Error or no data when fetching payment link:', linkError);
        }
      } else {
        console.log(`No payment_link_id found for request ${requestId}`);
      }
    } else if (paymentLinkId) {
      // If we have a direct payment link ID (not through a request), fetch its details
      console.log(`Payment has direct paymentLinkId: ${paymentLinkId}, fetching details`);
      
      const { data: linkData, error: linkError } = await supabase
        .from('payment_links')
        .select('type, title')
        .eq('id', paymentLinkId)
        .maybeSingle();
        
      if (!linkError && linkData) {
        paymentLinkType = linkData.type;
        paymentLinkTitle = linkData.title;
        console.log(`Retrieved payment link type: ${paymentLinkType}, title: ${paymentLinkTitle}`);
      } else {
        console.error('Error or no data when fetching payment link:', linkError);
      }
    }

    // Create payment record with correct payment type and title information
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        clinic_id: clinicId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        amount_paid: amount,
        paid_at: new Date().toISOString(),
        payment_link_id: paymentLinkId,
        payment_ref: paymentReference,
        stripe_payment_id: paymentIntent.id,
        status: 'paid',
        net_amount: netAmount,
        platform_fee: platformFeeAmount,
        stripe_fee: stripeFee, // Use actual Stripe fee
        // Set payment_type and payment_title correctly based on what we found
        payment_type: paymentLinkType || null,
        payment_title: paymentLinkTitle || null
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw paymentError;
    }
    
    console.log('Payment record created:', payment.id);
    
    // Try to resolve patient ID for consistency
    let patientId = payment.patient_id;
    
    // If patient ID is not set in the payment record (by trigger), try to find/create it
    if (!patientId && (patientEmail || patientPhone)) {
      try {
        patientId = await PatientService.findOrCreatePatient(
          supabase,
          patientName,
          patientEmail,
          patientPhone,
          clinicId
        );
        
        if (patientId) {
          console.log(`Resolved patient ID: ${patientId} for standard payment record`);
          
          // Update payment record with patient_id if it wasn't set by the trigger
          await supabase
            .from('payments')
            .update({ patient_id: patientId })
            .eq('id', payment.id);
        }
      } catch (patientErr) {
        console.error("Error resolving patient ID:", patientErr);
        // Non-critical, continue processing
      }
    }
    
    // If this payment was for a payment request, update it and check if it's part of a plan
    if (requestId) {
      console.log(`Updating payment request: ${requestId}`);
      
      const { error: requestUpdateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_id: payment.id,
          patient_id: patientId || null // Ensure patient_id is consistently set here too
        })
        .eq('id', requestId);
        
      if (requestUpdateError) {
        console.error('Error updating payment request:', requestUpdateError);
        // Non-critical error, continue
      } else {
        console.log(`Updated payment request ${requestId} status to 'paid'`);

        // NEW: Check if this payment request is associated with a payment_schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select(`
            id, 
            patient_id, 
            payment_link_id, 
            clinic_id,
            payment_number,
            total_payments,
            payment_frequency,
            plan_id
          `)
          .eq('payment_request_id', requestId)
          .single();
          
        if (!scheduleError && scheduleData) {
          console.log(`Found payment schedule entry: ${scheduleData.id} for plan: ${scheduleData.plan_id}`);
          
          // Update the payment schedule status
          const { error: updateScheduleError } = await supabase
            .from('payment_schedule')
            .update({ 
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduleData.id);
            
          if (updateScheduleError) {
            console.error('Error updating payment schedule status:', updateScheduleError);
          } else {
            console.log(`Updated payment schedule ${scheduleData.id} status to 'paid'`);
          }
          
          // Update the payment record with payment_schedule_id for consistency
          await supabase
            .from('payments')
            .update({ payment_schedule_id: scheduleData.id })
            .eq('id', payment.id);
          
          // Update plan data if this payment is linked to a plan
          if (scheduleData.plan_id) {
            console.log(`Updating plan data for plan: ${scheduleData.plan_id}`);
            
            try {
              // Get current plan data
              const { data: planData, error: planFetchError } = await supabase
                .from('plans')
                .select('total_installments, paid_installments, status')
                .eq('id', scheduleData.plan_id)
                .single();
                
              if (planFetchError) {
                console.error('Error fetching plan details:', planFetchError);
              } else {
                // Count actual paid installments from payment_schedule table
                const { count: paidInstallments, error: countError } = await supabase
                  .from('payment_schedule')
                  .select('id', { count: 'exact', head: true })
                  .eq('plan_id', scheduleData.plan_id)
                  .eq('status', 'paid');
                  
                if (countError) {
                  console.error('Error counting paid installments:', countError);
                } else {
                  // Calculate new values
                  const progress = Math.round((paidInstallments / planData.total_installments) * 100);
                  
                  // Determine if all installments are paid
                  const isCompleted = paidInstallments >= planData.total_installments;
                  
                  console.log(`Plan update details:
                    - Paid installments: ${paidInstallments}/${planData.total_installments}
                    - Progress: ${progress}%
                    - Completed: ${isCompleted}
                  `);
                  
                  // Update plan with new values
                  const { error: planUpdateError } = await supabase
                    .from('plans')
                    .update({
                      paid_installments: paidInstallments,
                      progress: progress,
                      status: isCompleted ? 'completed' : 'active',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', scheduleData.plan_id);
                    
                  if (planUpdateError) {
                    console.error('Error updating plan record:', planUpdateError);
                  } else {
                    console.log(`Successfully updated plan record. New progress: ${progress}%`);
                  }
                  
                  // Update next due date if not completed
                  if (!isCompleted) {
                    // Find the next unpaid installment
                    const { data: nextPayment, error: nextPaymentError } = await supabase
                      .from('payment_schedule')
                      .select('due_date')
                      .eq('plan_id', scheduleData.plan_id)
                      .eq('status', 'pending')
                      .order('due_date', { ascending: true })
                      .limit(1)
                      .single();
                      
                    if (nextPayment && !nextPaymentError) {
                      // Update plan's next due date
                      await supabase
                        .from('plans')
                        .update({
                          next_due_date: nextPayment.due_date
                        })
                        .eq('id', scheduleData.plan_id);
                        
                      console.log(`Updated plan ${scheduleData.plan_id} next due date to ${nextPayment.due_date}`);
                    }
                  } else {
                    // If completed, set next_due_date to null
                    await supabase
                      .from('plans')
                      .update({
                        next_due_date: null
                      })
                      .eq('id', scheduleData.plan_id);
                      
                    console.log(`Plan ${scheduleData.plan_id} completed, next_due_date set to null`);
                  }
                  
                  // Record payment activity for plan payment - CHANGED ACTION TYPE HERE
                  try {
                    await supabase
                      .from('payment_activity')
                      .insert({
                        payment_link_id: scheduleData.payment_link_id,
                        patient_id: patientId || scheduleData.patient_id,
                        clinic_id: clinicId,
                        action_type: 'card_payment_processed', // Changed from 'installment_payment_received'
                        plan_id: scheduleData.plan_id,
                        details: {
                          amount: amount,
                          paymentId: payment.id,
                          paymentReference,
                          installmentNumber: paidInstallments,
                          totalInstallments: planData.total_installments,
                          progress: progress
                        }
                      });
                      
                    console.log('Recorded plan payment activity');
                  } catch (activityError) {
                    console.error('Error recording plan payment activity:', activityError);
                  }
                }
              }
            } catch (planError) {
              console.error('Error updating plan:', planError);
            }
          }
        }
      }
    }
    
    // Record payment activity - UNCHANGED as this wasn't related to installments
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: patientId,
        clinic_id: clinicId,
        action_type: 'payment_received',
        details: {
          amount: amount,
          paymentId: payment.id,
          paymentReference,
          requestId: requestId || null
        }
      });
    
    console.log('Payment activity record created with patient_id:', patientId);
    
    // Queue notification
    try {
      console.log('Queueing payment notifications');
      
      // Get clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }
      
      // Queue patient notification
      if (patientEmail || patientPhone) {
        const patientPayload = {
          notification_type: "payment_success",
          notification_method: {
            email: !!patientEmail,
            sms: !!patientPhone
          },
          patient: {
            name: patientName || 'Patient',
            email: patientEmail,
            phone: patientPhone
          },
          payment: {
            reference: paymentReference,
            amount: amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
            message: "Your payment was successful"
          },
          clinic: {
            id: clinicId,
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        const { error: notifyError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_success',
            payload: patientPayload,
            payment_id: payment.id,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error(`Error queueing patient notification: ${notifyError.message}`);
        } else {
          console.log(`Successfully queued payment success notification for patient`);
        }
      }
      
      // Queue clinic notification
      const clinicPayload = {
        notification_type: "payment_success",
        notification_method: {
          email: clinicData?.email_notifications ?? true,
          sms: clinicData?.sms_notifications ?? false
        },
        patient: {
          name: patientName || 'Anonymous',
          email: patientEmail,
          phone: patientPhone
        },
        payment: {
          reference: paymentReference,
          amount: amount,
          refund_amount: null,
          payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
          message: "Payment received successfully",
          financial_details: {
            gross_amount: amount,
            stripe_fee: stripeFee,
            platform_fee: platformFeeAmount,
            net_amount: netAmount
          }
        },
        clinic: {
          id: clinicId,
          name: clinicData?.clinic_name || 'Your clinic',
          email: clinicData?.email,
          phone: clinicData?.phone
        }
      };
      
      const { error: clinicNotifyError } = await supabase
        .from("notification_queue")
        .insert({
          type: 'payment_success',
          payload: clinicPayload,
          payment_id: payment.id,
          recipient_type: 'clinic'
        });
        
      if (clinicNotifyError) {
        console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
      } else {
        console.log(`Successfully queued payment notification for clinic`);
      }
      
    } catch (notifyErr) {
      console.error(`Error in notification processing: ${notifyErr.message}`);
      // Don't throw, just log the error
    }
    
    return {
      success: true,
      paymentId: payment.id,
      message: 'Payment recorded successfully'
    };
  } catch (error) {
    console.error('Error processing standard payment:', error);
    throw error;
  }
}

export async function handlePaymentIntentFailed(paymentIntent: any, supabase: SupabaseClient) {
  console.log(`Processing failed payment: ${paymentIntent.id}`);
  
  try {
    // Extract metadata
    const metadata = paymentIntent.metadata || {};
    const clinicId = metadata.clinicId;
    const patientName = metadata.patientName || 'Unknown';
    const paymentLinkId = metadata.paymentLinkId || null;
    const requestId = metadata.requestId || null;
    const paymentScheduleId = metadata.payment_schedule_id;
    const planId = metadata.planId;
    
    // Log the payment failure
    console.log(`Payment failed for clinic ${clinicId}, patient: ${patientName}`);
    console.log('Failure reason:', paymentIntent.last_payment_error?.message || 'Unknown');
    
    // Record failed payment in activity
    await supabase
      .from('payment_activity')
      .insert({
        payment_link_id: paymentLinkId,
        patient_id: null,
        clinic_id: clinicId,
        action_type: 'payment_failed',
        plan_id: planId || null,
        details: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          failureMessage: paymentIntent.last_payment_error?.message || 'Unknown error',
          paymentScheduleId: paymentScheduleId || null
        }
      });
    
    // If this was a payment request, update its status
    if (requestId) {
      await supabase
        .from('payment_requests')
        .update({
          status: 'failed'
        })
        .eq('id', requestId);
      
      console.log(`Updated payment request ${requestId} status to 'failed'`);
    }
    
    // If this was an installment payment, we might want to handle it specifically
    if (paymentScheduleId && planId) {
      console.log(`Failed payment was for installment: ${paymentScheduleId}, plan: ${planId}`);
      // We don't change the status of the payment_schedule, it remains 'pending'
      // This allows the user to retry the payment
    }
    
    return {
      success: false,
      message: 'Payment failure recorded'
    };
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

/**
 * Handler for refund.updated webhook events
 * This function logs detailed information about the refund update
 */
export async function handleRefundUpdateEvent(refundObject: any, stripe: any, supabase: SupabaseClient) {
  console.log(`Processing refund.updated event for refund ID: ${refundObject.id}`);
  
  try {
    // Log the entire refund object for debugging
    console.log("Complete refund object data:", JSON.stringify(refundObject, null, 2));
    
    // Extract key information from the refund
    const refundId = refundObject.id;
    const amount = refundObject.amount;
    const status = refundObject.status;
    const chargeId = refundObject.charge;
    const currency = refundObject.currency;
    const created = new Date(refundObject.created * 1000).toISOString();
    const reason = refundObject.reason;
    
    console.log(`Refund details:
      ID: ${refundId}
      Amount: ${amount}
      Status: ${status}
      Charge ID: ${chargeId}
      Currency: ${currency}
      Created: ${created}
      Reason: ${reason || 'Not specified'}
    `);
    
    // If we have a charge ID, retrieve more details about the charge
    if (chargeId) {
      console.log(`Retrieving charge details for: ${chargeId}`);
      
      try {
        const charge = await stripe.charges.retrieve(chargeId);
        console.log("Charge object data:", JSON.stringify(charge, null, 2));
        
        // Extract payment intent ID if available
        const paymentIntentId = charge.payment_intent;
        console.log(`Associated payment intent ID: ${paymentIntentId}`);
        
        // If the charge has a balance transaction, retrieve and log it
        if (charge.balance_transaction) {
          console.log(`Retrieving balance transaction for: ${charge.balance_transaction}`);
          
          try {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(
              charge.balance_transaction
            );
            
            console.log("Balance transaction data:", JSON.stringify(balanceTransaction, null, 2));
            console.log(`Balance transaction details:
              Type: ${balanceTransaction.type}
              Amount: ${balanceTransaction.amount}
              Fee: ${balanceTransaction.fee}
              Net: ${balanceTransaction.net}
              Status: ${balanceTransaction.status}
            `);
            
            // Log fee details if available
            if (balanceTransaction.fee_details && balanceTransaction.fee_details.length > 0) {
              console.log("Fee breakdown details:");
              balanceTransaction.fee_details.forEach((fee: any, idx: number) => {
                console.log(`Fee ${idx + 1}: ${fee.type}, Amount: ${fee.amount}, Description: ${fee.description}`);
              });
            }
          } catch (balanceError) {
            console.error(`Error retrieving balance transaction: ${balanceError.message}`);
          }
        }
        
        // If the charge is connected to a customer, log customer details
        if (charge.customer) {
          console.log(`Associated customer ID: ${charge.customer}`);
        }
        
        // Find payment in our database using the payment intent ID or charge ID
        if (paymentIntentId) {
          console.log(`Looking up payment record with stripe_payment_id: ${paymentIntentId}`);
          
          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('stripe_payment_id', paymentIntentId)
            .maybeSingle();
            
          if (paymentError) {
            console.error(`Error looking up payment record: ${paymentError.message}`);
          } else if (payment) {
            console.log(`Found payment record:
              ID: ${payment.id}
              Reference: ${payment.payment_ref}
              Amount: ${payment.amount_paid}
              Status: ${payment.status}
            `);
          } else {
            console.log(`No payment record found for payment intent: ${paymentIntentId}`);
          }
        }
      } catch (chargeError) {
        console.error(`Error retrieving charge data: ${chargeError.message}`);
      }
    }
    
    return {
      success: true,
      message: `Refund update event processed for refund ID: ${refundId}`,
      refundStatus: status
    };
  } catch (error) {
    console.error(`Error processing refund update event: ${error.message}`);
    console.error("Error details:", error);
    return {
      success: false,
      message: `Error processing refund update event: ${error.message}`
    };
  }
}
