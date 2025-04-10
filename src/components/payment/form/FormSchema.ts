
import { z } from 'zod';

export const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  cardNumber: z.string()
    .min(16, { message: 'Card number must be at least 16 digits' })
    .max(19, { message: 'Card number must not exceed 19 digits' }),
  cardExpiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, { message: 'Expiry date must be in MM/YY format' }),
  cardCvc: z.string()
    .min(3, { message: 'CVC must be at least 3 digits' })
    .max(4, { message: 'CVC must not exceed 4 digits' }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
