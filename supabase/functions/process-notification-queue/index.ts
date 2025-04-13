
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Increased batch size for testing
const BATCH_SIZE = 20;
// Maximum number of retries before marking a notification as failed
const MAX_RETRIES = 3;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log(`🕒 Starting notification queue processing at ${new Date().toISOString()}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending notifications from the queue
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      console.error("❌ Error fetching pending notifications:", fetchError);
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("✅ No pending notifications to process");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No pending notifications" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    console.log(`📦 Found ${pendingNotifications.length} pending notifications`);
    
    // Process each notification
    const results = await Promise.all(pendingNotifications.map(async (notification) => {
      try {
        console.log(`🔔 Processing notification ${notification.id} of type ${notification.type} for ${notification.recipient_type}`);
        
        // Determine which webhook to use based on recipient_type
        const webhookUrl = notification.recipient_type === 'patient' 
          ? Deno.env.get("PATIENT_NOTIFICATION")
          : Deno.env.get("CLINIC_NOTIFICATION");
        
        if (!webhookUrl) {
          throw new Error(`Missing ${notification.recipient_type} notification webhook URL`);
        }

        // Enhance the notification payload with additional data
        let enhancedPayload = { ...notification.payload };
        
        // If this is a payment notification, fetch additional data
        if (notification.payment_id && (notification.type === 'payment_success' || notification.type === 'payment_failed')) {
          // Enrich the payload with additional data
          enhancedPayload = await enrichPayloadWithData(supabase, notification);
        }

        // Send notification to the appropriate webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enhancedPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Webhook response for notification ${notification.id}: ${response.status} - ${errorText}`);
          throw new Error(`Webhook returned ${response.status}: ${errorText}`);
        }

        // Update notification status to success
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({
            status: "success",
            processed_at: new Date().toISOString()
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error(`❌ Error updating notification ${notification.id} status:`, updateError);
        }

        console.log(`✅ Successfully processed notification ${notification.id}`);
        return { id: notification.id, success: true };
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);
        
        // Calculate new status based on retry count
        const newRetryCount = (notification.retry_count || 0) + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? "failed" : "pending";
        
        // Update notification with error and increment retry count
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: error.message || "Unknown error",
            processed_at: newStatus === "failed" ? new Date().toISOString() : null
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error(`❌ Error updating notification ${notification.id} retry info:`, updateError);
        }

        return { id: notification.id, success: false, error: error.message };
      }
    }));

    // Summarize results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📊 Processed ${results.length} notifications: ${successCount} succeeded, ${failureCount} failed/retrying`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      succeeded: successCount,
      failed: failureCount,
      details: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (err) {
    console.error("❌ Error in notification queue processor:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "An unexpected error occurred"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

/**
 * Enriches the notification payload with additional data from the database
 */
async function enrichPayloadWithData(supabase, notification) {
  try {
    const paymentId = notification.payment_id;
    const payload = notification.payload;
    const recipientType = notification.recipient_type;
    
    console.log(`🔍 Enriching payload for ${recipientType} notification with payment ID: ${paymentId}`);
    
    // If no payment ID, just return the original payload
    if (!paymentId) {
      console.log("⚠️ No payment ID found, returning original payload");
      return payload;
    }
    
    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          id,
          clinic_name,
          logo_url,
          email,
          phone,
          address_line_1,
          address_line_2,
          city,
          postcode,
          country
        )
      `)
      .eq("id", paymentId)
      .maybeSingle();
    
    if (paymentError) {
      console.error(`❌ Error fetching payment data for ID ${paymentId}:`, paymentError);
      return payload; // Return original payload if there's an error
    }
    
    if (!payment) {
      console.log(`⚠️ No payment found with ID ${paymentId}, returning original payload`);
      return payload;
    }
    
    console.log(`📝 Found payment data for ID ${paymentId}`);
    
    // Create enhanced payload based on recipient type
    let enhancedPayload = { ...payload };
    
    // Add clinic data
    if (payment.clinics) {
      const clinic = payment.clinics;
      
      // Format the address
      const addressParts = [
        clinic.address_line_1,
        clinic.address_line_2,
        clinic.city,
        clinic.postcode,
        clinic.country
      ].filter(Boolean);
      
      const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : null;
      
      enhancedPayload.clinic = {
        id: clinic.id,
        name: clinic.clinic_name || 'Unknown Clinic',
        logo_url: clinic.logo_url,
        email: clinic.email,
        phone: clinic.phone,
        address: formattedAddress
      };
    }
    
    // Common payment details for all notifications
    enhancedPayload.payment = {
      id: payment.id,
      reference: payment.payment_ref,
      amount: payment.amount_paid,
      status: payment.status,
      date: payment.paid_at,
      patient_name: payment.patient_name || enhancedPayload.patient_name || 'Patient'
    };
    
    // For clinic notifications, add financial details
    if (recipientType === 'clinic') {
      enhancedPayload.payment.financial_details = {
        gross_amount: payment.amount_paid,
        stripe_fee: payment.stripe_fee ? payment.stripe_fee / 100 : 0, // Convert from cents to pounds
        platform_fee: payment.platform_fee ? payment.platform_fee / 100 : 0, // Convert from cents to pounds
        net_amount: payment.net_amount ? payment.net_amount / 100 : 0 // Convert from cents to pounds
      };
    }
    
    // For patient notifications, simplify
    if (recipientType === 'patient') {
      // Make sure patient has contact details
      enhancedPayload.patient = {
        name: payment.patient_name || enhancedPayload.patient_name || 'Patient',
        email: payment.patient_email || enhancedPayload.patient_email,
        phone: payment.patient_phone || enhancedPayload.patient_phone
      };
    }
    
    // Add notification type and timestamp
    enhancedPayload.notification = {
      type: notification.type,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✨ Successfully enriched payload for ${recipientType} notification`);
    return enhancedPayload;
  } catch (error) {
    console.error("❌ Error enriching notification payload:", error);
    // Return original payload if enrichment fails
    return notification.payload;
  }
}
