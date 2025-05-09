
declare module '@stripe/stripe-js' {
  export interface StripeConstructor {
    (key: string, options?: any): any;
  }
  
  export function loadStripe(key: string, options?: any): Promise<any>;
}

declare module '@stripe/react-stripe-js' {
  import { ReactNode } from 'react';
  
  export function Elements(props: { stripe: any; options?: any; children: ReactNode }): JSX.Element;
  
  export function useStripe(): any | null;
  export function useElements(): any | null;
  
  export function CardElement(props: { 
    id?: string;
    className?: string;
    options?: any;
    onChange?: (event: any) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    onReady?: () => void;
  }): JSX.Element;
  
  export function PaymentRequestButtonElement(props: {
    className?: string;
    options?: {
      paymentRequest: any;
      style?: {
        paymentRequestButton?: {
          type?: 'default' | 'donate' | 'buy';
          theme?: 'dark' | 'light' | 'light-outline';
          height?: string;
        };
      };
    };
    onChange?: (event: any) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    onReady?: () => void;
  }): JSX.Element;
}
