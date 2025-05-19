import Stripe from "https://esm.sh/stripe@14.21.0";

export async function handlePaymentIntentSucceeded(paymentIntent: any, supabaseClient: any) {
  console.log(`Processing successful payment intent: ${paymentIntent.id}`);
  
  try {
    // Extract metadata from the payment intent
    const { 
      clinicId, 
      paymentLinkId, 
      requestId, 
      patientId, 
      paymentReference,
      payment_schedule_id
    } = paymentIntent.metadata || {};
    
    console.log('Payment metadata:', { 
      clinicId, 
      paymentLinkId, 
      requestId, 
      patientId, 
      paymentReference,
      payment_schedule_id
    });
    
    // Extract customer details from the payment
    const customerDetails = paymentIntent.charges?.data?.[0]?.billing_details || {};
    const paymentStatus = paymentIntent.charges?.data?.[0]?.status;
    const paymentMethod = paymentIntent.charges?.data?.[0]?.payment_method_details?.type || 'card';
    
    console.log('Customer details:', customerDetails);
    console.log('Payment status:', paymentStatus);
    
    // First check if this is for a payment request
    let paymentType = null;
    let paymentTitle = null;
    
    if (requestId) {
      console.log(`Processing payment for request: ${requestId}`);
      
      // Fetch the payment request details
      const { data: requestData, error: requestError } = await supabaseClient
        .from('payment_requests')
        .select(`
          *,
          payment_links(id, type, title, description, payment_plan)
        `)
        .eq('id', requestId)
        .single();
        
      if (requestError) {
        console.error(`Error fetching payment request: ${requestError.message}`);
      } else if (requestData) {
        console.log('Payment request data:', requestData);
        
        // Determine if this is a custom amount request
        const isCustomAmount = !!requestData.custom_amount && !requestData.payment_link_id;
        
        if (isCustomAmount) {
          // Set payment type and title for custom amount
          paymentType = 'other';
          paymentTitle = 'Custom Payment';
          console.log('Setting custom payment type and title', { paymentType, paymentTitle });
        } else if (requestData.payment_links) {
          // Use the payment link data for type and title
          paymentType = requestData.payment_links.type || 'other';
          paymentTitle = requestData.payment_links.title;
          console.log('Using payment link type and title from request', { paymentType, paymentTitle });
        }
        
        // Mark the request as paid
        await supabaseClient
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', requestId);
      }
    } else if (paymentLinkId) {
      console.log(`Processing payment for payment link: ${paymentLinkId}`);
      
      // Fetch the payment link details
      const { data: linkData, error: linkError } = await supabaseClient
        .from('payment_links')
        .select('*')
        .eq('id', paymentLinkId)
        .single();
        
      if (linkError) {
        console.error(`Error fetching payment link: ${linkError.message}`);
      } else if (linkData) {
        console.log('Payment link data:', linkData);
        paymentType = linkData.type || 'other';
        paymentTitle = linkData.title;
        console.log('Using payment link type and title', { paymentType, paymentTitle });
      }
    }
    
    // If payment is from a schedule, update the payment schedule too
    if (payment_schedule_id) {
      console.log(`Updating payment schedule: ${payment_schedule_id}`);
      await supabaseClient
        .from('payment_schedule')
        .update({
          status: 'paid'
        })
        .eq('id', payment_schedule_id);
    }
    
    // Create payment record with the determined type and title
    const paymentRecord = {
      stripe_payment_id: paymentIntent.id,
      clinic_id: clinicId,
      amount_paid: paymentIntent.amount,
      payment_ref: paymentReference,
      status: 'paid',
      paid_at: new Date().toISOString(),
      patient_name: customerDetails.name,
      patient_email: customerDetails.email,
      patient_phone: customerDetails.phone,
      payment_method: paymentMethod,
      payment_type: paymentType,  // Store the payment type
      payment_title: paymentTitle,  // Store the payment title
      payment_schedule_id: payment_schedule_id || null
    };
    
    // Add conditionally required fields
    if (paymentLinkId) paymentRecord.payment_link_id = paymentLinkId;
    if (patientId) paymentRecord.patient_id = patientId;
    
    console.log('Creating payment record:', paymentRecord);
    
    const { data: insertedPayment, error: insertError } = await supabaseClient
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error(`Error inserting payment record: ${insertError.message}`);
      return { 
        success: false, 
        error: insertError.message,
        status: 'error', 
        message: `Failed to create payment record: ${insertError.message}`
      };
    }
    
    console.log(`Payment record created successfully: ${insertedPayment.id}`);
    
    return { 
      success: true, 
      paymentId: insertedPayment.id,
      status: 'success',
      message: `Payment processed successfully`,
      payment: insertedPayment
    };
  } catch (error) {
    console.error(`Unexpected error processing payment: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      status: 'error',
      message: `Unexpected error: ${error.message}`
    };
  }
}

export async function handlePaymentIntentFailed(paymentIntent: any, supabaseClient: any) {
  console.log(`Handling failed payment intent: ${paymentIntent.id}`);

  try {
    // Extract relevant information from the payment intent
    const {
      clinicId,
      paymentLinkId,
      requestId,
      patientId,
      paymentReference,
    } = paymentIntent.metadata || {};

    // Log the metadata for debugging
    console.log('Payment metadata:', {
      clinicId,
      paymentLinkId,
      requestId,
      patientId,
      paymentReference,
    });

    // Extract customer details from the payment intent
    const customerDetails = paymentIntent.charges?.data?.[0]?.billing_details || {};
    const paymentMethod = paymentIntent.charges?.data?.[0]?.payment_method_details?.type || 'card';

    // Log customer details
    console.log('Customer details:', customerDetails);

    // Update payment requests status to failed
    if (requestId) {
      console.log(`Updating payment request status to failed for request: ${requestId}`);

      // Update the payment request status to 'failed'
      const { data: updatedRequest, error: updateError } = await supabaseClient
        .from('payment_requests')
        .update({ status: 'failed' })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        console.error(`Error updating payment request status: ${updateError.message}`);
      } else {
        console.log(`Payment request status updated successfully: ${updatedRequest.id}`);
      }
    }

    // Create a record for the failed payment
    const failedPaymentRecord = {
      stripe_payment_id: paymentIntent.id,
      clinic_id: clinicId,
      amount_paid: paymentIntent.amount,
      payment_ref: paymentReference,
      status: 'failed', // Set status to 'failed'
      paid_at: new Date().toISOString(),
      patient_name: customerDetails.name,
      patient_email: customerDetails.email,
      patient_phone: customerDetails.phone,
      payment_method: paymentMethod,
      payment_type: 'failed', // Set a default payment type for failed payments
      payment_title: 'Failed Payment', // Set a default payment title for failed payments
    };

    // Add conditionally required fields
    if (paymentLinkId) failedPaymentRecord.payment_link_id = paymentLinkId;
    if (patientId) failedPaymentRecord.patient_id = patientId;

    console.log('Creating failed payment record:', failedPaymentRecord);

    // Insert the failed payment record into the payments table
    const { data: insertedFailedPayment, error: insertError } = await supabaseClient
      .from('payments')
      .insert(failedPaymentRecord)
      .select()
      .single();

    if (insertError) {
      console.error(`Error inserting failed payment record: ${insertError.message}`);
      return {
        success: false,
        error: insertError.message,
        status: 'error',
        message: `Failed to create failed payment record: ${insertError.message}`,
      };
    }

    console.log(`Failed payment record created successfully: ${insertedFailedPayment.id}`);

    return {
      success: true,
      paymentId: insertedFailedPayment.id,
      status: 'success',
      message: `Failed payment recorded successfully`,
      payment: insertedFailedPayment,
    };
  } catch (error: any) {
    console.error(`Unexpected error handling failed payment: ${error.message}`);
    return {
      success: false,
      error: error.message,
      status: 'error',
      message: `Unexpected error: ${error.message}`,
    };
  }
}

export async function handleRefundUpdated(charge: any, stripe: any, supabaseClient: any) {
  console.log(`Handling refund updated event for charge: ${charge.id}`);

  try {
    // Extract the Payment Intent ID from the charge
    const paymentIntentId = charge.payment_intent;

    if (!paymentIntentId) {
      console.warn(`No Payment Intent ID found for charge: ${charge.id}`);
      return {
        success: false,
        status: 'warning',
        message: `No Payment Intent ID found for charge: ${charge.id}`,
      };
    }

    // Retrieve the Payment Intent to get associated metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      console.warn(`Payment Intent not found: ${paymentIntentId}`);
      return {
        success: false,
        status: 'warning',
        message: `Payment Intent not found: ${paymentIntentId}`,
      };
    }

    // Extract metadata from the Payment Intent
     const { paymentReference } = paymentIntent.metadata || {};

    // Extract refund details
    const refundedAmount = charge.amount_refunded;
    const currency = charge.currency;
    const status = charge.status;

    console.log('Refund details:', {
      paymentIntentId,
      refundedAmount,
      currency,
      status,
    });

    // Fetch the original payment record using the Payment Intent ID
    const { data: existingPayment, error: selectError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('stripe_payment_id', paymentIntentId)
      .single();

    if (selectError) {
      console.error(`Error fetching payment record: ${selectError.message}`);
      return {
        success: false,
        status: 'error',
        message: `Failed to retrieve payment record: ${selectError.message}`,
      };
    }

    if (!existingPayment) {
      console.warn(`Payment record not found for Payment Intent: ${paymentIntentId}`);
      return {
        success: false,
        status: 'warning',
        message: `Payment record not found for Payment Intent: ${paymentIntentId}`,
      };
    }

    // Determine the new status based on the refunded amount
    let newPaymentStatus = 'paid'; // Default to paid

    if (refundedAmount > 0) {
      if (refundedAmount === existingPayment.amount_paid) {
        newPaymentStatus = 'refunded'; // Fully refunded
      } else {
        newPaymentStatus = 'partially_refunded'; // Partially refunded
      }
    }

    console.log(`Updating payment status to: ${newPaymentStatus}`);

    // Update the payment record with refund information
    const { data: updatedPayment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: newPaymentStatus,
        refund_amount: refundedAmount,
      })
      .eq('stripe_payment_id', paymentIntentId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating payment record: ${updateError.message}`);
      return {
        success: false,
        status: 'error',
        message: `Failed to update payment record: ${updateError.message}`,
      };
    }

    console.log(`Payment record updated successfully: ${updatedPayment.id}`);

    return {
      success: true,
      paymentId: updatedPayment.id,
      status: 'success',
      message: `Payment record updated successfully`,
      payment: updatedPayment,
    };
  } catch (error: any) {
    console.error(`Unexpected error handling refund update: ${error.message}`);
    return {
      success: false,
      error: error.message,
      status: 'error',
      message: `Unexpected error: ${error.message}`,
    };
  }
}
