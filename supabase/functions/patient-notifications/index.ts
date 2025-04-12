
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    console.log("Received notification payload:", payload);

    // Format the data for the GHL webhook based on notification type
    const formattedPayload = await formatPayloadForGHL(payload, supabaseClient);
    
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
      return await formatPaymentSuccess(payload.record_id, formattedPayload, supabaseClient);
    } else if (payload.notification_type === "payment_refund") {
      return await formatPaymentRefund(payload.record_id, formattedPayload, supabaseClient);
    } else if (payload.notification_type === "payment_request") {
      return await formatPaymentRequest(payload.record_id, formattedPayload, supabaseClient);
    }

    return formattedPayload;
  } catch (error) {
    console.error("Error formatting payload:", error);
    return null;
  }
}

async function formatPaymentSuccess(
  paymentId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  // Get payment details - CHANGED: using maybeSingle() instead of single()
  const { data: payment, error: paymentError } = await supabaseClient
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

  if (paymentError) {
    console.error("Error fetching payment:", paymentError);
    throw new Error(`Failed to fetch payment: ${paymentError.message}`);
  }
  
  // ADDED: Check if payment exists
  if (!payment) {
    console.error(`No payment found with ID: ${paymentId}`);
    throw new Error(`No payment found with ID: ${paymentId}`);
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
    refund_amount: null,
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment-receipt/${paymentId}`,
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
  // Get payment details - CHANGED: using maybeSingle() instead of single()
  const { data: payment, error: paymentError } = await supabaseClient
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

  if (paymentError) {
    console.error("Error fetching payment for refund:", paymentError);
    throw new Error(`Failed to fetch refunded payment: ${paymentError.message}`);
  }
  
  // ADDED: Check if payment exists
  if (!payment) {
    console.error(`No payment found with ID: ${paymentId}`);
    throw new Error(`No payment found with ID: ${paymentId}`);
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
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment-receipt/${paymentId}`,
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
  // Get payment link details - CHANGED: using maybeSingle() instead of single()
  const { data: paymentLink, error: linkError } = await supabaseClient
    .from("payment_links")
    .select(`
      *,
      clinics:clinic_id (
        clinic_name,
        email,
        phone
      )
    `)
    .eq("id", linkId)
    .maybeSingle();

  if (linkError) {
    console.error("Error fetching payment link:", linkError);
    throw new Error(`Failed to fetch payment link: ${linkError.message}`);
  }
  
  // ADDED: Check if payment link exists
  if (!paymentLink) {
    console.error(`No payment link found with ID: ${linkId}`);
    throw new Error(`No payment link found with ID: ${linkId}`);
  }

  // We don't have patient info for a newly created payment link
  // This would be populated when a payment request is created using this link

  // Update payment information
  basePayload.payment = {
    reference: "N/A", // Payment reference is created when paid
    amount: paymentLink.amount || 0,
    refund_amount: null,
    payment_link: `${Deno.env.get("APP_URL") || "https://clinipay.com"}/payment/${linkId}`,
    message: paymentLink.description || "A payment link has been created",
  };

  // Update clinic information
  if (paymentLink.clinics) {
    basePayload.clinic = {
      name: paymentLink.clinics.clinic_name || "N/A",
      email: paymentLink.clinics.email || "N/A",
      phone: paymentLink.clinics.phone || "N/A",
    };
  }

  return basePayload;
}
