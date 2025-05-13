
export interface RawClinicData {
  id: string;
  clinic_name?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  stripe_status?: string;
}

export interface PaymentLinkData {
  id: string;
  title?: string;
  type?: string;
  amount: number;
  description?: string;
  clinic: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    stripeStatus: string;
  };
  status?: string;
  isActive?: boolean; // Add the isActive property from is_active in DB
  isRequest: boolean;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  paymentId?: string;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  customAmount?: number;
  hasOverduePayments?: boolean;
  payment_link_id?: string;
  isRescheduled?: boolean;
  is_active?: boolean; // Database format property
}
