
import { z } from 'zod';

// Update the schema to use Stripe's CardElement
export const paymentFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  stripeCard: z.any(), // This will hold the Stripe CardElement state
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
