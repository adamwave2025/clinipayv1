
export interface PaymentLinkData {
  id: string;
  title: string;
  amount: number;
  type: string;
  description?: string;
  status?: string;
  clinic: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    stripeStatus?: string;
  };
  isRequest?: boolean;
  customAmount?: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  // Payment plan fields
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  // Added field to track if payment is completed
  paymentId?: string;
}

export interface RawClinicData {
  id: string;
  clinic_name: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  stripe_status: string | null;
}
