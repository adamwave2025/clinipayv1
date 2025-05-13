
import { PaymentLink } from '@/types/payment';

/**
 * Formats payment links for display and adds additional properties
 */
export function formatPaymentLinks(links: any[]): PaymentLink[] {
  if (!links || !Array.isArray(links)) {
    console.error('Invalid payment links data:', links);
    return [];
  }

  return links.map(link => {
    try {
      // Default link values to prevent rendering errors
      const safeLink = {
        id: link.id || '',
        title: link.title || 'Untitled Link',
        amount: link.amount || 0,
        type: link.type || 'unknown',
        description: link.description || '',
        isActive: link.isActive !== undefined ? link.isActive : 
                 (link.is_active !== undefined ? link.is_active : true),
        created_at: link.created_at || new Date().toISOString(),
        payment_plan: !!link.payment_plan,
        patient: null,
        payment_count: link.payment_count || null,
        payment_cycle: link.payment_cycle || null,
        plan_total_amount: link.plan_total_amount || null
      };

      // Add computed properties
      return {
        ...safeLink,
        // Add any computed properties here
        formattedDate: formatCreatedAt(safeLink.created_at),
        typeLabel: formatTypeLabel(safeLink.type),
        isActive: safeLink.isActive // Using the normalized isActive property
      };
    } catch (err) {
      console.error('Error formatting payment link:', err, link);
      // Return a safe default object to prevent UI crashes
      return {
        id: link.id || 'error-link',
        title: 'Error: Malformed Link',
        amount: 0,
        type: 'unknown',
        description: '',
        isActive: false,
        created_at: new Date().toISOString(),
        formattedDate: 'Unknown date',
        typeLabel: 'Unknown',
        payment_plan: false,
        patient: null,
        payment_count: null,
        payment_cycle: null,
        plan_total_amount: null
      };
    }
  });
}

function formatCreatedAt(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Unknown date';
  }
}

function formatTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'treatment': 'Treatment',
    'consultation': 'Consultation',
    'deposit': 'Deposit',
    'payment_plan': 'Payment Plan',
    'unknown': 'Unknown'
  };

  return typeMap[type] || 'Other';
}

/**
 * Determines if a payment link is still active based on its status
 */
export function isPaymentLinkActive(link: PaymentLink | null): boolean {
  if (!link) return false;
  return link.isActive === true;
}
