
import { FormattedPayload } from "./config.ts";
import { retryOperation, findPaymentRecord } from "./utils.ts";

// Format payment success notification for clinics
export async function formatPaymentSuccess(
  paymentId: string,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment success clinic notification for ID: ${paymentId}`);
  
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

  // Check if clinic notifications are enabled
  if (payment.clinics && !payment.clinics.email_notifications) {
    console.log(`Clinic ${payment.clinic_id} has email notifications disabled, but continuing to format payload`);
  }

  // Format the payload for GHL
  const formattedPayload: FormattedPayload = {
    notification_type: "payment_success",
    payment: {
      reference: payment.payment_ref || "N/A",
      amount: payment.amount_paid || 0,
      refund_amount: null,
      patient_name: payment.patient_name || "Unknown",
      patient_email: payment.patient_email || "N/A",
      patient_phone: payment.patient_phone || "N/A",
      status: payment.status || "paid",
      paid_at: payment.paid_at || new Date().toISOString(),
      refunded_at: null
    },
    clinic: {
      name: payment.clinics?.clinic_name || "N/A",
      email: payment.clinics?.email || "N/A",
      phone: payment.clinics?.phone || "N/A"
    }
  };

  return formattedPayload;
}

// Format payment refund notification for clinics
export async function formatPaymentRefund(
  paymentId: string,
  supabaseClient: any
): Promise<FormattedPayload> {
  console.log(`Processing payment refund clinic notification for ID: ${paymentId}`);
  
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

  // Check if clinic notifications are enabled
  if (payment.clinics && !payment.clinics.email_notifications) {
    console.log(`Clinic ${payment.clinic_id} has email notifications disabled, but continuing to format payload`);
  }

  // Format the payload for GHL
  const formattedPayload: FormattedPayload = {
    notification_type: "payment_refund",
    payment: {
      reference: payment.payment_ref || "N/A",
      amount: payment.amount_paid || 0,
      refund_amount: payment.refund_amount || null,
      patient_name: payment.patient_name || "Unknown",
      patient_email: payment.patient_email || "N/A",
      patient_phone: payment.patient_phone || "N/A",
      status: payment.status || "refunded",
      paid_at: payment.paid_at || new Date().toISOString(),
      refunded_at: payment.refunded_at || new Date().toISOString()
    },
    clinic: {
      name: payment.clinics?.clinic_name || "N/A",
      email: payment.clinics?.email || "N/A",
      phone: payment.clinics?.phone || "N/A"
    }
  };

  return formattedPayload;
}
