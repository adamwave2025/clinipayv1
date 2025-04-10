
import { z } from 'zod';

export const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  cardNumber: z.string().min(1, { message: 'Card number is required' }),
  cardExpiry: z.string().min(1, { message: 'Expiry date is required' }),
  cardCvc: z.string().min(1, { message: 'CVC is required' }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
