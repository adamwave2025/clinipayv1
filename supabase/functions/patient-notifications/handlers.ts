
import { FormattedPayload, NotificationPayload } from "./config.ts";
import { corsHeaders } from "./config.ts";
import { createSupabaseClient, retryOperation } from "./utils.ts";
import { formatPaymentSuccess, formatPaymentRefund, formatPaymentRequest } from "./formatters.ts";

// Handler for the notification request
export async function handleNotification(req: Request): Promise<Response> {
  try {
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();

    // Get the webhook URL from environment variables
    const webhookUrl = Deno.env.get("PATIENT_NOTIFICATION");
    if (!webhookUrl) {
      console.error("Missing PATIENT_NOTIFICATION webhook URL");
      throw new Error("Webhook URL not configured");
    }

    // Parse the notification payload from the request
    const payload: NotificationPayload = await req.json();
    console.log("Received notification payload:", JSON.stringify(payload));
    console.log(`Processing ${payload.notification_type} for record ID: ${payload.record_id}`);

    // Check if record_id exists before proceeding
    if (!payload.record_id) {
      console.error("Error: Missing record_id in notification payload");
      throw new Error("Missing record_id in notification payload");
    }

    // Format the data for the GHL webhook based on notification type
    const formattedPayload = await retryOperation(
      () => formatPayloadForGHL(payload, supabaseClient),
      undefined,
      undefined,
      (error, attempt) => {
        console.log(`Retry attempt ${attempt} for formatting payload: ${error.message}`);
      }
    );
    
    if (!formattedPayload) {
      throw new Error("Failed to format payload");
    }

    console.log("Sending formatted payload to GHL:", formattedPayload);

    // Send the webhook to GHL
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from GHL webhook:", errorText);
      throw new Error(`GHL webhook returned status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log("GHL webhook response:", responseData);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing patient notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Format payload for GoHighLevel based on notification type
async function formatPayloadForGHL(
  payload: NotificationPayload,
  supabaseClient: any
): Promise<FormattedPayload | null> {
  try {
    // Initialize with default values
    const formattedPayload: FormattedPayload = {
      notification_type: payload.notification_type,
      notification_method: {
        sms: false,
        email: false,
      },
      patient: {
        name: "N/A",
        email: "N/A",
        phone: "N/A",
      },
      payment: {
        reference: "N/A",
        amount: 0,
        refund_amount: null,
        payment_link: "N/A",
        message: "N/A",
      },
      clinic: {
        name: "N/A",
        phone: "N/A",
        email: "N/A",
      },
    };

    // Process based on the notification type
    if (payload.notification_type === "payment_success") {
      console.log(`Formatting payload for payment_success with ID: ${payload.record_id}`);
      return await formatPaymentSuccess(payload.record_id, formattedPayload, supabaseClient);
    } else if (payload.notification_type === "payment_refund") {
      console.log(`Formatting payload for payment_refund with ID: ${payload.record_id}`);
      return await formatPaymentRefund(payload.record_id, formattedPayload, supabaseClient);
    } else if (payload.notification_type === "payment_request") {
      console.log(`Formatting payload for payment_request with ID: ${payload.record_id}`);
      return await formatPaymentRequest(payload.record_id, formattedPayload, supabaseClient);
    }

    return formattedPayload;
  } catch (error) {
    console.error("Error formatting payload:", error);
    throw error; // Re-throw the error to be caught by the retry mechanism
  }
}
