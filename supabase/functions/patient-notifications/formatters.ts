import { FormattedPayload } from "./config.ts";
import { retryOperation, findPaymentRecord } from "./utils.ts";

// First, add a function to get the correct base URL
function getBaseUrl(): string {
  return Deno.env.get("APP_URL") || "https://clinipay.co.uk";
}

// Format payment success notification
export async function formatPaymentSuccess(
  paymentId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment success notification for ID: ${paymentId}`);
  
  // Find the payment record with retry logic
  const payment = await retryOperation(
    () => findPaymentRecord(paymentId, supabaseClient),
    undefined,
    undefined,
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
    payment_link: `${getBaseUrl()}/payment-receipt/${payment.id}`,
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

// Format payment refund notification
export async function formatPaymentRefund(
  paymentId: string,
  basePayload: FormattedPayload,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment refund notification for ID: ${paymentId}`);
  
  // Find the payment record with retry logic
  const payment = await retryOperation(
    () => findPaymentRecord(paymentId, supabaseClient),
    undefined,
    undefined,
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
    payment_link: `${getBaseUrl()}/payment-receipt/${payment.id}`,
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

// Format payment request notification
export async function formatPaymentRequest(
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
    undefined,
    undefined,
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
    payment_link: `${getBaseUrl()}/payment/${linkId}`,
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
