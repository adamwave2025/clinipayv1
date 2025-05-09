
# Payment Module

This module is responsible for all payment-related functionality in the application.

## Structure

- `/components` - UI components for payment forms, summaries, and displays
- `/hooks` - Custom hooks for payment logic
- `/services` - Services for currency conversion, payment links, etc.
- `/types` - TypeScript types for payment-related data
- `/utils` - Utility functions for formatting, validation, etc.

## Main Features

1. **Payment Processing**
   - Stripe integration for card payments
   - Apple Pay support
   - Payment form validation

2. **Currency Handling**
   - Conversion between pence and pounds
   - Amount validation

3. **Payment Links**
   - Generation of payment links
   - Payment link data retrieval

4. **Payment Plans**
   - Support for installment payments
   - Plan status tracking

## Integration Points

- The module exposes its API through barrel exports in the root `index.ts`
- Components can be imported from `@/modules/payment/components`
- Hooks can be imported from `@/modules/payment/hooks`
- Types can be imported from `@/modules/payment/types`

## Usage Examples

```tsx
// Import components
import { PaymentForm, PaymentSummary } from '@/modules/payment/components';

// Import hooks
import { usePaymentProcess, usePaymentLinkData } from '@/modules/payment/hooks';

// Import services
import { penceToPounds, poundsToPence } from '@/modules/payment/services';

// Import types
import { PaymentLinkData } from '@/modules/payment/types';
```
