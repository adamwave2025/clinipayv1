
# Payment Module

This module handles all payment-related functionality in the CliniPay application.

## Structure

- `/components`: UI components for payment processing and display
- `/hooks`: Custom hooks for payment logic
- `/services`: Services for payment processing, currency handling, etc.
- `/types`: TypeScript types/interfaces for payment-related data
- `/utils`: Utility functions for the payment module

## Key Components

### Payment Flow Components
- `PaymentForm`: The main payment form component
- `PaymentDetailsSection`: Section for entering payment details
- `PersonalInfoSection`: Section for entering personal information
- `StripeCardElement`: UI for card input with Stripe
- `ApplePayButton`: Component for Apple Pay integration

### UI Components 
- `PaymentStatusSummary`: Displays payment status information
- `PaymentErrorBoundary`: Handles and displays payment errors
- `CliniPaySecuritySection`: Displays security information
- `ClinicInformationCard`: Displays clinic information

## Key Hooks

- `usePaymentProcess`: Main hook for processing payments
- `useStripePayment`: Hook for Stripe payment integration
- `usePaymentIntent`: Hook for creating payment intents
- `usePaymentLinkData`: Hook for fetching payment link data
- `usePaymentRecord`: Hook for recording payments

## Services

- `CurrencyService`: Handles currency formatting and validation
- `PaymentLinkService`: Manages payment links
- `PaymentPlanService`: Manages payment plans
- `PlanDataService`: Handles payment plan data

## Integration Points

This module integrates with:
- Stripe for payment processing
- Supabase for data storage
- Email/SMS notifications for payment confirmations

## Usage Example

```tsx
import { usePaymentProcess, PaymentForm } from '@/modules/payment';

const PaymentPage = () => {
  const { handlePaymentSubmit, isSubmitting } = usePaymentProcess(linkId, linkData);
  
  return (
    <PaymentForm 
      onSubmit={handlePaymentSubmit} 
      isLoading={isSubmitting}
    />
  );
};
```
