
import { z } from 'zod';

export const paymentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  cardComplete: z.boolean().default(false),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
