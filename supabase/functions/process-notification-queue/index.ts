
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

/**
 * Format a monetary value from pence/cents to pounds/dollars with 2 decimal places
 * This ensures consistency in all notification payloads
 */
function formatMonetaryValue(amountInPence) {
  if (amountInPence === null || amountInPence === undefined) return 0.00;
  
  // Convert from pence to pounds and ensure 2 decimal places
  return (amountInPence / 100).toFixed(2);
}

/**
 * Recursively process an object to convert all numeric values that appear to be monetary amounts
 * from pence/cents to properly formatted pounds/dollars with 2 decimal places
 */
function processMonetaryValues(obj, parentKey = '') {
  // Skip if it's not an object or if it's null
  if (!obj || typeof obj !== 'object') return obj;
  
  // Process arrays
  if (Array.isArray(obj)) {
    return obj.map(item => processMonetaryValues(item));
  }
  
  // Process objects
  const result = {...obj};
  
  for (const [key, value] of Object.entries(obj)) {
    // Special handling for known monetary fields
    const isMonetaryField = ['amount', 'refund_amount', 'gross_amount', 'stripe_fee', 'platform_fee', 'net_amount'].includes(key);
    
    if (isMonetaryField && typeof value === 'number') {
      // Special handling for refund_amount in payment or payment_refund notification types
      if ((obj.notification_type === 'payment_refund' || obj.notification_type === 'refund') && key === 'refund_amount') {
        console.log(`💰 Special handling for refund_amount: ${value}`);
        
        // If refund_amount appears to already be in pounds (less than 1000), don't convert
        if (value < 1000 && value % 1 === 0) {
          // This might be a value that was already converted (e.g., already in pounds)
          // But we still want to ensure it has 2 decimal places for formatting in the email
          result[key] = Number(value.toFixed(2));
          console.log(`💰 Refund amount appears to be already in pounds: ${value} => ${result[key]}`);
        } else {
          // Assume it's in pence and convert to pounds
          result[key] = Number(formatMonetaryValue(value));
          console.log(`💰 Converted ${key} from ${value}p to £${result[key]}`);
        }
      } 
      // Regular conversion for other monetary fields
      else {
        // Convert monetary values from pence to pounds with 2 decimal places
        result[key] = Number(formatMonetaryValue(value));
        console.log(`💰 Converted ${key} from ${value}p to £${result[key]}`);
      }
    } 
    // Recursively process nested objects
    else if (value && typeof value === 'object') {
      result[key] = processMonetaryValues(value, key);
    }
  }
  
  return result;
}

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
        
        // STEP 1: First handle any special case logic for different notification types
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
        } else if (notification.type === 'payment_refund' || notification.type === 'refund') {
          // Special handling for refund notifications - ensure refund_amount is properly formatted
          console.log(`💰 Special handling for refund notification`);
          if (enhancedPayload.payment && enhancedPayload.payment.refund_amount !== undefined) {
            console.log(`💰 Original refund_amount: ${enhancedPayload.payment.refund_amount}`);
            
            // If it appears the refund amount is already in pounds but might be missing decimal formatting
            if (typeof enhancedPayload.payment.refund_amount === 'number') {
              // We'll still run it through our processor to ensure proper formatting
              console.log(`💰 Refund amount is a number, will be processed`);
            } else {
              // If it's not a number, convert it to a number with 2 decimal places
              enhancedPayload.payment.refund_amount = Number(parseFloat(String(enhancedPayload.payment.refund_amount)).toFixed(2));
              console.log(`💰 Converted refund_amount to number: ${enhancedPayload.payment.refund_amount}`);
            }
          }
        }
        
        // STEP 2: Now convert ALL monetary values consistently to pounds with 2 decimal places
        // This ensures the emails show correct formatting like £1000.00 instead of £1000 or £100000
        console.log(`💰 Processing monetary values in notification payload`);
        enhancedPayload = processMonetaryValues(enhancedPayload);

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
        id: clinic.id, // Ensure ID is included
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
    
    // IMPORTANT: Convert monetary values from cents to display currency with 2 decimal places
    // Add payment data with amounts converted from cents to display currency
    const amountPaid = payment.amount_paid ? formatMonetaryValue(payment.amount_paid) : "0.00";
    const refundAmount = payment.refund_amount ? formatMonetaryValue(payment.refund_amount) : null;
    
    console.log(`💰 Converting amount_paid from cents: ${payment.amount_paid} to display currency: ${amountPaid}`);
    if (payment.refund_amount) {
      console.log(`💰 Converting refund_amount from cents: ${payment.refund_amount} to display currency: ${refundAmount}`);
    }
    
    enhancedPayload.payment = {
      reference: payment.payment_ref || "N/A",
      amount: Number(amountPaid), // Converted from cents to pounds/dollars with 2 decimal places
      refund_amount: refundAmount ? Number(refundAmount) : null, // Converted from cents to pounds/dollars
      payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
      message: notification.type === 'payment_success' ? 
        "Your payment was successful" : 
        "Your payment has failed"
    };
    
    // For clinic notifications, add financial details
    if (recipientType === 'clinic') {
      // Convert all financial values from cents to pounds/dollars with 2 decimal places
      enhancedPayload.payment.financial_details = {
        gross_amount: Number(amountPaid), // Already converted above
        stripe_fee: Number(formatMonetaryValue(payment.stripe_fee || 0)),
        platform_fee: Number(formatMonetaryValue(payment.platform_fee || 0)),
        net_amount: Number(formatMonetaryValue(payment.net_amount || 0))
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
