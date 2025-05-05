
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
    
    // Get webhook URLs from environment variables or from system_settings
    let patientWebhook = Deno.env.get("PATIENT_NOTIFICATION");
    let clinicWebhook = Deno.env.get("CLINIC_NOTIFICATION");
    
    // If webhook URLs are not set in environment, try to get them from system_settings
    if (!patientWebhook || !clinicWebhook) {
      console.log("🔍 Webhook URLs not found in environment, checking system_settings...");
      
      const { data: webhookSettings, error: settingsError } = await supabase
        .from("system_settings")
        .select("*")
        .in("key", ["patient_notification_webhook", "clinic_notification_webhook"]);
      
      if (settingsError) {
        console.error("❌ Error fetching webhook settings:", settingsError);
      } else if (webhookSettings && webhookSettings.length > 0) {
        for (const setting of webhookSettings) {
          if (setting.key === "patient_notification_webhook") {
            patientWebhook = setting.value;
          } else if (setting.key === "clinic_notification_webhook") {
            clinicWebhook = setting.value;
          }
        }
        console.log("✅ Found webhook URLs in system_settings");
      }
    }
    
    // Fallback to default webhooks if still not found
    if (!patientWebhook) {
      console.warn("⚠️ Patient notification webhook not found, using default");
      patientWebhook = "https://notification-service.clinipay.co.uk/patient-notifications";
    }
    
    if (!clinicWebhook) {
      console.warn("⚠️ Clinic notification webhook not found, using default");
      clinicWebhook = "https://notification-service.clinipay.co.uk/clinic-notifications";
    }
    
    // Process each notification
    const results = await Promise.all(pendingNotifications.map(async (notification) => {
      try {
        console.log(`🔔 Processing notification ${notification.id} of type ${notification.type} for ${notification.recipient_type}`);
        
        // Determine which webhook to use based on recipient_type
        const webhookUrl = notification.recipient_type === 'patient' 
          ? patientWebhook
          : clinicWebhook;
        
        if (!webhookUrl) {
          throw new Error(`Missing ${notification.recipient_type} notification webhook URL`);
        }

        // Process the notification payload based on the type
        let enhancedPayload = { ...notification.payload };
        
        // Handle payment_success, payment_failed, and payment_request types
        if (notification.type === 'payment_success' || notification.type === 'payment_failed') {
          // If this is a payment notification with payment_id, enrich with additional data
          if (notification.payment_id) {
            enhancedPayload = await enrichPayloadWithData(supabase, notification);
          }
        } else if (notification.type === 'payment_request') {
          // For payment requests, ensure URLs are properly formatted
          if (enhancedPayload.payment?.payment_link && !enhancedPayload.payment.payment_link.startsWith('http')) {
            enhancedPayload.payment.payment_link = `https://clinipay.co.uk/payment/${enhancedPayload.payment.payment_link}`;
          }
          
          // Make sure notification methods are based on patient contact info
          if (enhancedPayload.patient) {
            enhancedPayload.notification_method = {
              email: !!enhancedPayload.patient.email,
              sms: !!enhancedPayload.patient.phone
            };
          }
          
          // IMPORTANT: Convert monetary values from cents to display currency (pounds/dollars)
          // This ensures amounts in payment requests are properly formatted
          if (enhancedPayload.payment && enhancedPayload.payment.amount) {
            // Convert from cents to pounds/dollars if it appears to be stored in cents
            // (determined by checking if it's a large integer likely to be in cents)
            if (Number.isInteger(enhancedPayload.payment.amount) && enhancedPayload.payment.amount >= 1000) {
              console.log(`💰 Converting amount from cents: ${enhancedPayload.payment.amount} to display currency: ${enhancedPayload.payment.amount / 100}`);
              enhancedPayload.payment.amount = enhancedPayload.payment.amount / 100;
            }
          }
        }

        console.log(`📤 Sending notification to webhook: ${webhookUrl.substring(0, 30)}...`);
        console.log(`📋 Payload: ${JSON.stringify(enhancedPayload).substring(0, 200)}...`);

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

        console.log(`✅ Webhook response: ${response.status}`);

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
 * IMPORTANT: Monetary values in the database are stored in cents (1/100 of currency unit)
 * This function converts them to display currency (pounds/dollars) before returning
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
          country,
          email_notifications,
          sms_notifications
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
    let enhancedPayload = { 
      notification_type: notification.type === 'payment_success' ? 'payment_success' : 'payment_failed'
    };
    
    // Set notification_method based on available patient contact details
    if (recipientType === 'patient') {
      enhancedPayload.notification_method = {
        email: !!payment.patient_email,
        sms: !!payment.patient_phone
      };
    } else {
      // For clinic notifications, use clinic preferences
      enhancedPayload.notification_method = {
        email: payment.clinics?.email_notifications ?? true,
        sms: payment.clinics?.sms_notifications ?? true
      };
    }
    
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
        name: clinic.clinic_name || 'Your healthcare provider',
        email: clinic.email,
        phone: clinic.phone,
        address: formattedAddress
      };
    }
    
    // Add patient data
    enhancedPayload.patient = {
      name: payment.patient_name || payload.patient_name || 'Patient',
      email: payment.patient_email || payload.patient_email,
      phone: payment.patient_phone || payload.patient_phone
    };
    
    // IMPORTANT: Convert monetary values from cents to display currency
    // Add payment data with amounts converted from cents to display currency
    const amountPaid = payment.amount_paid ? payment.amount_paid / 100 : 0;
    const refundAmount = payment.refund_amount ? payment.refund_amount / 100 : null;
    
    console.log(`💰 Converting amount_paid from cents: ${payment.amount_paid} to display currency: ${amountPaid}`);
    
    enhancedPayload.payment = {
      reference: payment.payment_ref || "N/A",
      amount: amountPaid, // Converted from cents to pounds/dollars
      refund_amount: refundAmount, // Converted from cents to pounds/dollars
      payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
      message: notification.type === 'payment_success' ? 
        "Your payment was successful" : 
        "Your payment has failed"
    };
    
    // For clinic notifications, add financial details
    if (recipientType === 'clinic') {
      // Convert all financial values from cents to pounds/dollars
      enhancedPayload.payment.financial_details = {
        gross_amount: amountPaid, // Already converted above
        stripe_fee: payment.stripe_fee ? payment.stripe_fee / 100 : 0,
        platform_fee: payment.platform_fee ? payment.platform_fee / 100 : 0,
        net_amount: payment.net_amount ? payment.net_amount / 100 : 0
      };
    }
    
    console.log(`✨ Successfully enriched payload for ${recipientType} notification`);
    return enhancedPayload;
  } catch (error) {
    console.error("❌ Error enriching notification payload:", error);
    // Return original payload if enrichment fails
    return notification.payload;
  }
}

