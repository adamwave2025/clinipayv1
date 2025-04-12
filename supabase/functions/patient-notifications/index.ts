
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define types for our notification data
interface NotificationPayload {
  table: string;
  operation: string;
  notification_type: "payment_success" | "payment_refund" | "payment_request";
  record_id: string;
}

interface FormattedPayload {
  notification_type: string;
  notification_method: {
    sms: boolean;
    email: boolean;
  };
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  payment: {
    reference: string;
    amount: number;
    refund_amount: number | null;
    payment_link: string;
    message: string;
  };
  clinic: {
    name: string;
    phone: string;
    email: string;
  };
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function to sleep for a specified time
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  errorHandler?: (error: any, attempt: number) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    if (errorHandler) {
      errorHandler(error, MAX_RETRIES - retries + 1);
    }
    
    await sleep(delay);
    return retryOperation(operation, retries - 1, delay * 2, errorHandler);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Patient notification function called at:", new Date().toISOString());
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
      MAX_RETRIES,
      INITIAL_RETRY_DELAY,
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
});

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

async function findPaymentRecord(paymentId: string, supabaseClient: any): Promise<any> {
  console.log(`Looking for payment with ID: ${paymentId} using different search methods`);
  
  try {
    // Try to find by direct ID match
    const { data: directMatch, error: directError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .eq("id", paymentId)
      .maybeSingle();
    
    if (directError) {
      console.error("Error in direct ID search:", directError);
    }
    
    if (directMatch) {
      console.log(`Found payment directly by ID: ${paymentId}`);
      return directMatch;
    }
    
    console.log(`No direct match found, trying stripe_payment_id search for: ${paymentId}`);
    
    // Try to find by stripe_payment_id
    const { data: stripeMatch, error: stripeError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .eq("stripe_payment_id", paymentId)
      .maybeSingle();
    
    if (stripeError) {
      console.error("Error in stripe_payment_id search:", stripeError);
    }
    
    if (stripeMatch) {
      console.log(`Found payment by stripe_payment_id: ${paymentId}`);
      return stripeMatch;
    }
    
    // Try the most recently created payment as a last resort
    console.log("No payment found by either method, checking most recent payments");
    const { data: recentPayments, error: recentError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error("Error fetching recent payments:", recentError);
    }
    
    if (recentPayments && recentPayments.length > 0) {
      console.log(`Checking ${recentPayments.length} recent payments`);
      console.log(`Recent payment IDs: ${recentPayments.map(p => p.id).join(', ')}`);
      console.log(`Recent payment stripe IDs: ${recentPayments.map(p => p.stripe_payment_id).join(', ')}`);
    } else {
      console.log("No recent payments found in the last 5 entries");
    }
    
    console.error(`No payment found with ID: ${paymentId} after all search attempts`);
    throw new Error(`No payment found with ID: ${paymentId}`);
  } catch (error) {
    console.error(`Error finding payment record: ${error.message}`);
    throw error;
  }
}

async function formatPaymentSuccess(
  paymentId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment success notification for ID: ${paymentId}`);
  
  // Find the payment record with retry logic
  const payment = await retryOperation(
    () => findPaymentRecord(paymentId, supabaseClient),
    MAX_RETRIES,
    INITIAL_RETRY_DELAY,
    (error, attempt) => {
      console.log(`Retry attempt ${attempt} finding payment record: ${error.message}`);
    }
  );

  if (!payment) {
    throw new Error(`No payment record found for ID: ${paymentId} after multiple retries`);
  }

  console.log(`Successfully retrieved payment data for ID: ${paymentId}`);

  // Update notification methods based on available data
  basePayload.notification_method = {
    email: !!payment.patient_email,
    sms: !!payment.patient_phone,
  };

  // Update patient information
  basePayload.patient = {
    name: payment.patient_name || "N/A",
    email: payment.patient_email || "N/A",
    phone: payment.patient_phone || "N/A",
  };

  // Update payment information
  basePayload.payment = {
    reference: payment.payment_ref || "N/A",
    amount: payment.amount_paid || 0,
    refund_amount: null,
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment-receipt/${payment.id}`,
    message: "Your payment was successful",
  };

  // Update clinic information
  if (payment.clinics) {
    basePayload.clinic = {
      name: payment.clinics.clinic_name || "N/A",
      email: payment.clinics.email || "N/A",
      phone: payment.clinics.phone || "N/A",
    };
  }

  return basePayload;
}

async function formatPaymentRefund(
  paymentId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment refund notification for ID: ${paymentId}`);
  
  // Find the payment record with retry logic
  const payment = await retryOperation(
    () => findPaymentRecord(paymentId, supabaseClient),
    MAX_RETRIES,
    INITIAL_RETRY_DELAY,
    (error, attempt) => {
      console.log(`Retry attempt ${attempt} finding refund payment record: ${error.message}`);
    }
  );

  if (!payment) {
    throw new Error(`No payment record found for refund ID: ${paymentId} after multiple retries`);
  }

  // Update notification methods based on available data
  basePayload.notification_method = {
    email: !!payment.patient_email,
    sms: !!payment.patient_phone,
  };

  // Update patient information
  basePayload.patient = {
    name: payment.patient_name || "N/A",
    email: payment.patient_email || "N/A",
    phone: payment.patient_phone || "N/A",
  };

  // Update payment information
  basePayload.payment = {
    reference: payment.payment_ref || "N/A",
    amount: payment.amount_paid || 0,
    refund_amount: payment.refund_amount || null,
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment-receipt/${payment.id}`,
    message: payment.status === "refunded" 
      ? "Your payment has been fully refunded" 
      : "Your payment has been partially refunded",
  };

  // Update clinic information
  if (payment.clinics) {
    basePayload.clinic = {
      name: payment.clinics.clinic_name || "N/A",
      email: payment.clinics.email || "N/A",
      phone: payment.clinics.phone || "N/A",
    };
  }

  return basePayload;
}

async function formatPaymentRequest(
  linkId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment request notification for ID: ${linkId}`);
  
  // Get payment request details with retry logic
  const paymentRequest = await retryOperation(
    async () => {
      const { data, error } = await supabaseClient
        .from("payment_requests")
        .select(`
          *,
          clinics:clinic_id (
            clinic_name,
            email,
            phone
          ),
          payment_links:payment_link_id (
            title,
            amount,
            type,
            description
          )
        `)
        .eq("id", linkId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching payment request:", error);
        throw new Error(`Failed to fetch payment request: ${error.message}`);
      }
      
      if (!data) {
        console.error(`No payment request found with ID: ${linkId}`);
        throw new Error(`No payment request found with ID: ${linkId}`);
      }
      
      return data;
    },
    MAX_RETRIES,
    INITIAL_RETRY_DELAY,
    (error, attempt) => {
      console.log(`Retry attempt ${attempt} finding payment request: ${error.message}`);
    }
  );

  if (!paymentRequest) {
    throw new Error(`No payment request found with ID: ${linkId} after multiple retries`);
  }
  
  console.log("Found payment request:", JSON.stringify(paymentRequest, null, 2));
  
  // Update notification methods based on available data
  basePayload.notification_method = {
    email: !!paymentRequest.patient_email,
    sms: !!paymentRequest.patient_phone,
  };
  
  // Update patient information
  basePayload.patient = {
    name: paymentRequest.patient_name || "N/A",
    email: paymentRequest.patient_email || "N/A",
    phone: paymentRequest.patient_phone || "N/A",
  };

  // Determine amount based on payment link or custom amount
  let amount = 0;
  
  if (paymentRequest.custom_amount) {
    // If it's a custom amount request
    amount = paymentRequest.custom_amount;
    console.log(`Using custom amount from request: ${amount}`);
  } else if (paymentRequest.payment_links && paymentRequest.payment_links.amount) {
    // If it's based on a payment link
    amount = paymentRequest.payment_links.amount;
    console.log(`Using amount from payment link: ${amount}`);
  }

  // Update payment information
  basePayload.payment = {
    reference: "N/A", // Payment reference is created when paid
    amount: amount,
    refund_amount: null,
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment/${linkId}`,
    message: paymentRequest.message || 
             (paymentRequest.payment_links ? paymentRequest.payment_links.description : null) || 
             "You have received a payment request",
  };

  // Update clinic information
  if (paymentRequest.clinics) {
    basePayload.clinic = {
      name: paymentRequest.clinics.clinic_name || "N/A",
      email: paymentRequest.clinics.email || "N/A",
      phone: paymentRequest.clinics.phone || "N/A",
    };
  }

  return basePayload;
}
