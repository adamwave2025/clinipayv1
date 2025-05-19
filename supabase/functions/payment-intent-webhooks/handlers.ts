
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { paymentIntentWebhookHandlers } from "./paymentHandlers.ts";
import { refundWebhookHandlers } from "./refundHandlers.ts";

export const handleStripeEvent = async (
  stripe: Stripe, 
  supabase: any, 
  event: any
): Promise<any> => {
  const eventType = event.type;
  console.log(`Processing ${eventType} event:`, event.id);
  
  try {
    // Handle payment_intent events
    if (eventType.startsWith('payment_intent.')) {
      return await handlePaymentIntentEvent(stripe, supabase, event);
    }
    
    // Handle charge events for refunds
    if (eventType.startsWith('charge.') || eventType.startsWith('refund.')) {
      return await handleRefundEvent(stripe, supabase, event);
    }
    
    // Default response for unhandled events
    return {
      success: true,
      message: `Event ${eventType} was received but not processed`
    };
  } catch (error) {
    console.error(`Error handling ${eventType} event:`, error);
    throw error;
  }
};

async function handlePaymentIntentEvent(stripe: Stripe, supabase: any, event: any): Promise<any> {
  const eventType = event.type;
  const paymentIntent = event.data.object;
  
  switch (eventType) {
    case 'payment_intent.succeeded':
      return await paymentIntentWebhookHandlers.handlePaymentIntentSucceeded(paymentIntent, supabase);
      
    case 'payment_intent.payment_failed':
      return await paymentIntentWebhookHandlers.handlePaymentIntentFailed(paymentIntent, supabase);
      
    default:
      return {
        success: true,
        message: `Payment intent event ${eventType} was received but not processed`
      };
  }
}

async function handleRefundEvent(stripe: Stripe, supabase: any, event: any): Promise<any> {
  const eventType = event.type;
  
  switch (eventType) {
    case 'refund.updated':
      return await refundWebhookHandlers.handleRefundUpdated(event.data.object, stripe, supabase);
      
    default:
      return {
        success: true,
        message: `Refund event ${eventType} was received but not processed`
      };
  }
}
