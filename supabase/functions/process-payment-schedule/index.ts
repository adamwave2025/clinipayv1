
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Starting payment schedule processing at", new Date().toISOString());

    // Get today's date in YYYY-MM-DD format for comparison
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Processing payments due on or before: ${today}`);

    // Find ONLY pending payments that are due today or earlier AND don't already have a payment request
    const { data: duePayments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select(`
        *,
        clinics:clinic_id (*),
        patients:patient_id (*),
        payment_links:payment_link_id (*)
      `)
      .eq('status', 'pending')
      .lte('due_date', today)
      .is('payment_request_id', null); // Only process payments without an existing request

    if (fetchError) {
      throw new Error(`Error fetching due payments: ${fetchError.message}`);
    }

    console.log(`📦 Found ${duePayments?.length || 0} payments due for processing`);

    if (!duePayments || duePayments.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: "No payments due for processing",
        processed: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    let processed = 0;
    let errors = 0;

    // Process each due payment
    for (const payment of duePayments) {
      try {
        console.log(`🔄 Processing payment #${payment.payment_number} of ${payment.total_payments} for clinic: ${payment.clinic_id}, plan: ${payment.plan_id}`);

        // Create a payment request
        const { data: paymentRequest, error: requestError } = await supabase
          .from('payment_requests')
          .insert({
            clinic_id: payment.clinic_id,
            patient_id: payment.patient_id,
            patient_name: payment.patients?.name,
            patient_email: payment.patients?.email,
            patient_phone: payment.patients?.phone,
            payment_link_id: payment.payment_link_id,
            message: `Payment ${payment.payment_number} of ${payment.total_payments} is due.`,
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .select()
          .single();

        if (requestError) {
          throw new Error(`Error creating payment request: ${requestError.message}`);
        }

        // Update the payment schedule status and link it to the payment request
        // CHANGED: Update status to 'sent' instead of 'processed'
        const { error: updateError } = await supabase
          .from('payment_schedule')
          .update({ 
            status: 'sent', 
            payment_request_id: paymentRequest.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updateError) {
          throw new Error(`Error updating payment schedule: ${updateError.message}`);
        }

        // Prepare notification payload for the patient
        const notificationPayload = {
          notification_type: "payment_request",
          notification_method: {
            email: !!payment.patients?.email,
            sms: !!payment.patients?.phone
          },
          patient: {
            name: payment.patients?.name || "Patient",
            email: payment.patients?.email,
            phone: payment.patients?.phone
          },
          payment: {
            reference: paymentRequest.id,
            amount: payment.amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment/${paymentRequest.id}`,
            message: `Payment ${payment.payment_number} of ${payment.total_payments} is due.`
          },
          clinic: {
            name: payment.clinics?.clinic_name || "Your healthcare provider",
            email: payment.clinics?.email,
            phone: payment.clinics?.phone,
            address: formatAddress(payment.clinics)
          }
        };

        // Add to notification queue
        const { error: notificationError } = await supabase
          .from("notification_queue")
          .insert({
            type: 'payment_request',
            payload: notificationPayload,
            recipient_type: 'patient',
            payment_id: paymentRequest.id,
            status: 'pending'
          });

        if (notificationError) {
          console.error("Failed to queue notification:", notificationError);
          // Continue with the next payment even if notification fails
        } else {
          console.log("✅ Payment request notification queued successfully");
        }

        processed++;
        console.log(`✅ Successfully processed payment ${payment.id}`);
      } catch (err) {
        console.error(`❌ Error processing payment ${payment.id}:`, err);
        errors++;
      }
    }

    console.log(`📊 Processing complete. Processed ${processed} payments. Errors: ${errors}`);

    // Return the results
    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processed} payments due on ${today}`,
      processed,
      errors
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("❌ Error processing payment schedule:", err);
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "An unexpected error occurred"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

// Helper function to format clinic address
function formatAddress(clinic: any): string {
  if (!clinic) return "";
  
  const addressParts = [];
  if (clinic.address_line_1) addressParts.push(clinic.address_line_1);
  if (clinic.address_line_2) addressParts.push(clinic.address_line_2);
  if (clinic.city) addressParts.push(clinic.city);
  if (clinic.postcode) addressParts.push(clinic.postcode);
  
  return addressParts.join(", ");
}
