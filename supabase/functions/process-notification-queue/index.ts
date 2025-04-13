
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Maximum number of notifications to process in a single batch
const BATCH_SIZE = 10;
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
    console.log("🔄 Starting notification queue processing");
    
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
      console.error("Error fetching pending notifications:", fetchError);
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
        console.log(`🔔 Processing notification ${notification.id} of type ${notification.type}`);
        
        // Determine which webhook to use based on recipient_type
        const webhookUrl = notification.recipient_type === 'patient' 
          ? Deno.env.get("PATIENT_NOTIFICATION")
          : Deno.env.get("CLINIC_NOTIFICATION");
        
        if (!webhookUrl) {
          throw new Error(`Missing ${notification.recipient_type} notification webhook URL`);
        }

        // Send notification to the appropriate webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notification.payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
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
          console.error(`Error updating notification ${notification.id} status:`, updateError);
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
          console.error(`Error updating notification ${notification.id} retry info:`, updateError);
        }

        return { id: notification.id, success: false, error: error.message };
      }
    }));

    // Summarize results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ Processed ${results.length} notifications: ${successCount} succeeded, ${failureCount} failed/retrying`);
    
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
