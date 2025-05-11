import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log("Stripe webhook received at:", new Date().toISOString());
    
    // Get Stripe secret key and webhook secret from environment variables
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      console.error("Missing Stripe secret key");
      throw new Error("Missing Stripe secret key");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the signature from the request
    const signature = req.headers.get("stripe-signature");
    
    // Detailed logging for diagnosis
    console.log(`Webhook secret available: ${!!stripeWebhookSecret}`);
    console.log(`Signature provided: ${!!signature}`);
    
    if (!signature && stripeWebhookSecret) {
      console.error("No stripe-signature header provided in the request");
      throw new Error("No signature provided in the request");
    }

    // Get the raw request body
    const requestBody = await req.text();
    console.log(`Request body length: ${requestBody.length} characters`);
    
    let event;
    
    // Verify webhook signature if secret is available
    if (stripeWebhookSecret && signature) {
      try {
        // Log partial signature and secret for debugging (masked for security)
        console.log(`Signature prefix: ${signature.substring(0, 10)}...`);
        console.log(`Secret key prefix: ${stripeWebhookSecret.substring(0, 5)}...`);
        
        // Use constructEventAsync instead of constructEvent
        event = await stripe.webhooks.constructEventAsync(requestBody, signature, stripeWebhookSecret);
        console.log("Signature verification successful!");
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        console.error("Details:", err);
        
        // Return proper error response with CORS headers
        return new Response(JSON.stringify({ 
          error: "Invalid signature",
          message: err.message
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // If no webhook secret, just parse the JSON (less secure, for development only)
      try {
        console.log("No signature verification - parsing JSON directly");
        event = JSON.parse(requestBody);
      } catch (err) {
        console.error(`Failed to parse payload: ${err.message}`);
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    console.log(`Processing Stripe event: ${event.type}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Event created at: ${new Date(event.created * 1000).toISOString()}`);

    // Handle different event types
    if (event.type === 'account.updated') {
      const account = event.data.object;
      console.log(`Received account.updated event for account: ${account.id}`);
      
      // Log the entire account object to help debug (excluding sensitive data)
      console.log("Account data:", {
        id: account.id,
        metadata: account.metadata,
        details_submitted: account.details_submitted,
        business_type: account.business_type,
        business_profile: account.business_profile
      });
      
      // Check if details_submitted is true
      if (account.details_submitted) {
        console.log(`Account ${account.id} has submitted details`);
        
        let clinicId;
        
        // Check if clinic_id is stored in metadata (preferred approach)
        if (account.metadata && account.metadata.clinic_id) {
          clinicId = account.metadata.clinic_id;
          console.log(`Found clinic_id ${clinicId} in account metadata`);
        } else {
          // If clinic_id is not in metadata, try to find the clinic by Stripe account ID
          console.log(`No clinic_id in metadata, falling back to finding clinic by account ID`);
          const { data: clinics, error: fetchError } = await supabase
            .from("clinics")
            .select("id")
            .eq("stripe_account_id", account.id);
            
          if (fetchError) {
            console.error(`Error fetching clinic: ${fetchError.message}`);
            throw fetchError;
          }
          
          console.log(`Found ${clinics?.length || 0} clinics with Stripe account ID: ${account.id}`);
          
          if (clinics && clinics.length > 0) {
            clinicId = clinics[0].id;
          } else {
            console.error(`No clinic found for Stripe account ID: ${account.id}`);
            throw new Error(`No clinic found for Stripe account ID: ${account.id}`);
          }
        }
        
        // Update the clinic's record
        const { error: updateError } = await supabase
          .from("clinics")
          .update({ 
            stripe_account_id: account.id,
            stripe_status: "connected" 
          })
          .eq("id", clinicId);
        
        if (updateError) {
          console.error(`Error updating clinic: ${updateError.message}`);
          throw updateError;
        }
        
        console.log(`Successfully updated clinic ${clinicId} to connected status`);
      } else {
        console.log(`Account ${account.id} has not submitted details yet, no update needed`);
      }
    } else if (event.type === 'payment_intent.succeeded') {
      // Handle payment_intent.succeeded events to update payment records and payment requests
      const paymentIntent = event.data.object;
      console.log(`Received payment_intent.succeeded event for payment: ${paymentIntent.id}`);
      
      // Extract metadata from the payment intent
      const metadata = paymentIntent.metadata || {};
      const requestId = metadata.requestId;
      const clinicId = metadata.clinicId;
      const paymentLinkId = metadata.paymentLinkId;
      const patientName = metadata.patientName;
      const patientEmail = metadata.patientEmail;
      const patientPhone = metadata.patientPhone;
      const paymentReference = metadata.paymentReference;
      const customAmount = metadata.customAmount ? parseInt(metadata.customAmount, 10) : null;
      
      console.log("Payment intent metadata:", metadata);
      
      // Check if there's already a payment record for this payment intent
      const { data: existingPayments, error: paymentsError } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_payment_id", paymentIntent.id);
        
      if (paymentsError) {
        console.error(`Error checking for existing payment record: ${paymentsError.message}`);
      }
      
      // Only create a payment record if one doesn't already exist
      if (!existingPayments || existingPayments.length === 0) {
        console.log(`No existing payment record found for ${paymentIntent.id}, creating new record`);
        
        let amount = paymentIntent.amount; // Default to the payment intent amount
        
        // If this is a payment request, try to get details from it
        if (requestId) {
          console.log(`Fetching payment request details for request ID: ${requestId}`);
          const { data: requestData, error: requestError } = await supabase
            .from("payment_requests")
            .select("custom_amount, patient_name, patient_email, patient_phone")
            .eq("id", requestId)
            .maybeSingle();
            
          if (!requestError && requestData) {
            console.log(`Found payment request data:`, requestData);
            // Use custom amount from request if available
            if (requestData.custom_amount) {
              amount = requestData.custom_amount * 100; // Convert to cents for consistency
              console.log(`Using custom amount from request: ${amount}`);
            }
          } else if (requestError) {
            console.error(`Error fetching payment request: ${requestError.message}`);
          }
        }
        
        // Use customAmount from metadata if available (as a fallback)
        if (customAmount && !amount) {
          amount = customAmount * 100; // Convert to cents for consistency
          console.log(`Using custom amount from metadata: ${amount}`);
        }
        
        try {
          // Convert amount from cents to pounds with precision
          const amountInPounds = Math.round(amount) / 100;
          console.log(`Converting amount from ${amount} cents to ${amountInPounds} pounds`);
          
          // Create the payment record
          const { data: paymentData, error: insertError } = await supabase
            .from("payments")
            .insert({
              clinic_id: clinicId,
              payment_link_id: paymentLinkId || null,
              patient_name: patientName || 'Anonymous',
              patient_email: patientEmail || null,
              patient_phone: patientPhone || null,
              amount_paid: amountInPounds,
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_id: paymentIntent.id,
              payment_ref: paymentReference || null
            })
            .select();
            
          if (insertError) {
            console.error(`Error creating payment record: ${insertError.message}`);
            throw insertError;
          }
          
          console.log(`Created payment record successfully:`, paymentData);
          
          // If this is a payment request, update the payment_requests table
          if (requestId) {
            console.log(`Updating payment request ${requestId} with payment status`);
            
            const paymentId = paymentData ? paymentData[0]?.id : null;
            
            const { error: updateError } = await supabase
              .from("payment_requests")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                payment_id: paymentId
              })
              .eq("id", requestId);
              
            if (updateError) {
              console.error(`Error updating payment request: ${updateError.message}`);
            } else {
              console.log(`Successfully updated payment request ${requestId}`);
              
              // NEW CODE: Check if this payment is part of a payment plan and update the plan accordingly
              try {
                // Get the payment schedule entry associated with this payment request
                const { data: scheduleData, error: scheduleError } = await supabase
                  .from("payment_schedule")
                  .select(`
                    id, 
                    plan_id,
                    payment_number,
                    total_payments,
                    payment_frequency
                  `)
                  .eq("payment_request_id", requestId)
                  .single();
                  
                if (scheduleError) {
                  console.log("No payment schedule entry found for this request, not a payment plan payment");
                } else if (scheduleData) {
                  console.log(`Found payment schedule entry: payment ${scheduleData.payment_number} of ${scheduleData.total_payments}`);
                  
                  // Update the payment schedule entry to paid status
                  const { error: updateScheduleError } = await supabase
                    .from("payment_schedule")
                    .update({ status: "paid" })
                    .eq("id", scheduleData.id);
                    
                  if (updateScheduleError) {
                    console.error(`Error updating payment schedule: ${updateScheduleError.message}`);
                  } else {
                    console.log("Successfully updated payment schedule status to paid");
                  }
                  
                  // Update the parent plan if there is one
                  if (scheduleData.plan_id) {
                    console.log(`Updating parent plan with ID: ${scheduleData.plan_id}`);
                    
                    try {
                      // First get the current plan data
                      const { data: planData, error: planFetchError } = await supabase
                        .from("plans")
                        .select("*")
                        .eq("id", scheduleData.plan_id)
                        .single();
                        
                      if (planFetchError) {
                        console.error("Error fetching plan data:", planFetchError);
                      } else if (planData) {
                        // Increment paid installments
                        const paidInstallments = (planData.paid_installments || 0) + 1;
                        const totalInstallments = planData.total_installments || scheduleData.total_payments;
                        
                        // Calculate new progress percentage
                        const progress = Math.floor((paidInstallments / totalInstallments) * 100) || 0;
                        
                        // Determine the new status
                        let newStatus = planData.status;
                        
                        // If all installments are paid, mark as completed
                        if (paidInstallments >= totalInstallments) {
                          newStatus = 'completed';
                        } 
                        // If some installments are paid but not all, mark as active (unless it's already overdue or paused)
                        else if (paidInstallments > 0 && (newStatus === 'pending' || newStatus === 'overdue')) {
                          newStatus = 'active';
                          console.log('Setting plan status to active after payment');
                        }
                        
                        // Find the next due date from remaining unpaid installments
                        let nextDueDate = null;
                        
                        // Get all schedule entries for this plan to find next due date
                        const { data: allScheduleEntries, error: entriesError } = await supabase
                          .from("payment_schedule")
                          .select("*")
                          .eq("plan_id", scheduleData.plan_id)
                          .order("due_date", { ascending: true });
                          
                        if (!entriesError && allScheduleEntries) {
                          // Find the first unpaid entry
                          const unpaidEntry = allScheduleEntries.find(entry => 
                            entry.status !== 'paid' && entry.status !== 'cancelled'
                          );
                          
                          if (unpaidEntry) {
                            nextDueDate = unpaidEntry.due_date;
                            console.log(`Found next due date: ${nextDueDate} for plan ${scheduleData.plan_id}`);
                          } else {
                            console.log(`No more unpaid entries found for plan ${scheduleData.plan_id}`);
                          }
                          
                          // Check for overdue status on remaining entries
                          const now = new Date();
                          now.setHours(0, 0, 0, 0); // Start of day for accurate comparison
                          
                          const hasOverduePayments = allScheduleEntries.some(entry => {
                            const dueDate = new Date(entry.due_date);
                            dueDate.setHours(0, 0, 0, 0); // Start of day for accurate comparison
                            return entry.status !== 'paid' && entry.status !== 'cancelled' && dueDate < now;
                          });
                          
                          // If plan is active but has overdue payments, mark as overdue (unless paused or cancelled)
                          if (hasOverduePayments && newStatus !== 'paused' && newStatus !== 'cancelled') {
                            newStatus = 'overdue';
                          }
                          
                          console.log({
                            action: 'updating_plan_record',
                            plan_id: scheduleData.plan_id,
                            paid_installments: paidInstallments,
                            progress: progress,
                            next_due_date: nextDueDate,
                            status: newStatus,
                            has_overdue_payments: hasOverduePayments
                          });
                          
                          // Update the plan with new values
                          const { error: planUpdateError } = await supabase
                            .from("plans")
                            .update({
                              paid_installments: paidInstallments,
                              progress: progress,
                              next_due_date: nextDueDate,
                              status: newStatus,
                              has_overdue_payments: hasOverduePayments
                            })
                            .eq("id", scheduleData.plan_id);
                          
                          if (planUpdateError) {
                            console.error("Error updating plan record:", planUpdateError);
                          } else {
                            console.log(`Successfully updated plan record. New status: ${newStatus}, Progress: ${progress}%, Next due date: ${nextDueDate || 'None'}`);
                          }
                        } else {
                          console.error("Error fetching all schedule entries:", entriesError);
                        }
                      }
                    } catch (planError) {
                      console.error("Error in plan update logic:", planError);
                    }
                  }
                }
              } catch (scheduleError) {
                console.error("Error checking for payment plan:", scheduleError);
              }
            }
          }
          
          // Queue patient notification for successful payment
          const paymentId = paymentData ? paymentData[0]?.id : null;
          if (paymentId && (patientEmail || patientPhone)) {
            try {
              // Create notification payload for patient
              const patientPayload = {
                clinic_id: clinicId,
                payment_id: paymentId,
                patient_name: patientName || 'Patient',
                patient_email: patientEmail,
                patient_phone: patientPhone,
                payment_amount: amountInPounds,
                payment_ref: paymentReference,
                payment_type: 'success',
                notification_type: 'payment_success'
              };
              
              // Add to notification queue for patient
              const { error: notifyError } = await supabase
                .from("notification_queue")
                .insert({
                  type: 'payment_success',
                  payload: patientPayload,
                  payment_id: paymentId,
                  recipient_type: 'patient'
                });
                
              if (notifyError) {
                console.error(`Error queueing patient notification: ${notifyError.message}`);
              } else {
                console.log(`Successfully queued payment success notification for patient`);
              }
              
              // Queue clinic notification as well
              const clinicPayload = {
                clinic_id: clinicId,
                payment_id: paymentId,
                patient_name: patientName || 'Anonymous',
                payment_amount: amountInPounds,
                payment_ref: paymentReference,
                payment_type: 'received',
                notification_type: 'payment_received'
              };
              
              const { error: clinicNotifyError } = await supabase
                .from("notification_queue")
                .insert({
                  type: 'payment_success',
                  payload: clinicPayload,
                  payment_id: paymentId,
                  recipient_type: 'clinic'
                });
                
              if (clinicNotifyError) {
                console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
              } else {
                console.log(`Successfully queued payment notification for clinic`);
              }
            } catch (notifyErr) {
              console.error(`Error in notification processing: ${notifyErr.message}`);
              // Don't rethrow, just log the error - this shouldn't affect the main payment processing
            }
          }
        } catch (error) {
          console.error(`Error processing payment record: ${error.message}`);
          throw error;
        }
      } else {
        console.log(`Payment record already exists for payment ${paymentIntent.id}`);
      }
    } else {
      console.log(`Ignoring event type: ${event.type} (not handled)`);
    }

    // Return a success response to Stripe
    console.log("Webhook processing completed successfully");
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (err) {
    console.error("Stripe Webhook Error:", err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
