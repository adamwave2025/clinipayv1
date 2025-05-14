
// Define the PaymentLinkData interface which represents payment link data
export interface PaymentLinkData {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  isPaymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  status?: string;
  isActive?: boolean;
  isRequest?: boolean;
  url?: string;
  clinic: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    stripeStatus?: string;
    address?: string;
  };
  createdAt?: string;
}
