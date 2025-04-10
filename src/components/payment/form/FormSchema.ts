
import { z } from 'zod';

// Update the schema to use simple UI fields instead of Stripe's CardElement
export const paymentFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  cardNumber: z.string()
    .min(16, { message: 'Card number must be at least 16 digits' })
    .regex(/^[\d\s]+$/, { message: 'Card number can only contain digits' }),
  cardExpiry: z.string()
    .regex(/^\d{2}\/\d{2}$/, { message: 'Expiry date must be in MM/YY format' }),
  cardCvc: z.string()
    .min(3, { message: 'CVC must be at least 3 digits' })
    .max(4, { message: 'CVC must not exceed 4 digits' })
    .regex(/^\d+$/, { message: 'CVC can only contain digits' }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
