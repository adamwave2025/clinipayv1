
import { z } from 'zod';

export const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  cardNumber: z.string().min(16, { message: 'Please enter a valid card number' }),
  cardExpiry: z.string().min(5, { message: 'Please enter a valid expiry date (MM/YY)' }),
  cardCvc: z.string().min(3, { message: 'Please enter a valid CVC code' }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
