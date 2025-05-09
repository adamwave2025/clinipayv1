
declare module '@stripe/stripe-js' {
  export interface StripeConstructor {
    (key: string, options?: any): any;
  }
  
  interface StripeElementsOptions {
    fonts?: any[];
    locale?: string;
  }
  
  interface StripeElements {
    create(type: string, options?: any): any;
    getElement(type: string): any | null;
  }
  
  interface StripeInstance {
    elements(options?: StripeElementsOptions): StripeElements;
    createToken(element: any, options?: any): Promise<{token?: any, error?: any}>;
    createSource(element: any, options?: any): Promise<{source?: any, error?: any}>;
    createPaymentMethod(type: string, element: any, options?: any): Promise<{paymentMethod?: any, error?: any}>;
    confirmCardPayment(clientSecret: string, data?: any, options?: any): Promise<{paymentIntent?: any, error?: any}>;
    confirmCardSetup(clientSecret: string, data?: any, options?: any): Promise<{setupIntent?: any, error?: any}>;
    retrievePaymentIntent(clientSecret: string): Promise<{paymentIntent?: any, error?: any}>;
    retrieveSetupIntent(clientSecret: string): Promise<{setupIntent?: any, error?: any}>;
  }
  
  export function loadStripe(key: string, options?: any): Promise<StripeInstance | null>;
}

declare module '@stripe/react-stripe-js' {
  import { ReactNode } from 'react';
  
  export interface ElementsProps {
    stripe: any;
    options?: any;
    children: ReactNode;
  }
  
  export function Elements(props: ElementsProps): JSX.Element;
  
  export function useStripe(): any | null;
  export function useElements(): any | null;
  
  export interface CardElementProps {
    id?: string;
    className?: string;
    options?: any;
    onChange?: (event: any) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    onReady?: () => void;
  }
  
  export function CardElement(props: CardElementProps): JSX.Element;
}
