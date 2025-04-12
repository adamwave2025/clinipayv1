
import { PaymentLink } from '@/types/payment';

export const formatPaymentLinks = (data: any[]): PaymentLink[] => data.map(link => ({
  id: link.id,
  title: link.title || '',
  amount: link.amount || 0,
  type: link.type || 'other',
  description: link.description || '',
  url: `${window.location.origin}/payment/${link.id}`,
  createdAt: new Date(link.created_at).toLocaleDateString(),
  isActive: link.is_active
}));
