
import * as z from 'zod';

// Payment form validation schema
export const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number' }),
  cardNumber: z.string()
    .min(16, { message: 'Please enter a valid card number' })
    .max(19, { message: 'Please enter a valid card number' })
    .refine((val) => /^[\d\s]+$/.test(val), { message: 'Card number can only contain digits and spaces' }),
  cardExpiry: z.string()
    .min(5, { message: 'Please enter a valid expiry date (MM/YY)' })
    .max(5, { message: 'Please enter a valid expiry date (MM/YY)' })
    .refine((val) => /^\d{2}\/\d{2}$/.test(val), { message: 'Expiry date should be in MM/YY format' }),
  cardCvc: z.string()
    .min(3, { message: 'CVC must be 3-4 digits' })
    .max(4, { message: 'CVC must be 3-4 digits' })
    .refine((val) => /^\d+$/.test(val), { message: 'CVC can only contain digits' }),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
