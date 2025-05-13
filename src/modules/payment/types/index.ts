
// Re-export all types from the payment module
export * from './payment';
export * from './paymentLink';

// Add common payment action type definitions
export interface PaymentAction {
  paymentId: string;
  installment?: any;
}
