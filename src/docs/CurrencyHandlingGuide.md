
# Currency Handling Guide

## Core Principles

1. **Database values** are always stored in **pence/cents** (integer values)
2. **UI/display values** are always in **pounds/dollars** (decimal values with currency symbol)
3. **Stripe** expects values in **pence/cents** (integer values)

## Common Mistakes to Avoid

1. **Double conversion**: Converting an already converted value (e.g., multiplying by 100 when the value is already in pence)
2. **Using the wrong formatter**: Using formatCurrency for user input or formatUserInputCurrency for database values
3. **Not validating amounts**: Always validate monetary amounts before processing payments
4. **Converting values twice**: NEVER convert pence to pounds in data formatting AND AGAIN in UI formatting

## How to Handle Currency in This Application

### 1. Import the Right Functions

```typescript
// For currency conversion
import { poundsToPence, penceToPounds } from '@/services/CurrencyService';

// For currency formatting
import { formatCurrency, formatUserInputCurrency } from '@/utils/formatters';

// For currency validation
import { validatePenceAmount, validatePoundsAmount } from '@/services/CurrencyService';

// For debugging currency issues
import { debugCurrencyInfo } from '@/services/CurrencyService';
```

### 2. Use the Right Function for the Right Context

#### Database/API Values (in pence/cents)

- When **displaying** database values: `formatCurrency(amount)` - which internally divides by 100
- When **validating** database values: `validatePenceAmount(amount, 'context')`
- NEVER convert database values to pounds in a data formatting function AND THEN use `formatCurrency` 
  which would result in double conversion

#### User Input/UI Values (in pounds/dollars)

- When **displaying** user input: `formatUserInputCurrency(amount)`
- When **validating** user input: `validatePoundsAmount(amount, 'context')`
- When **converting** to save to database: `poundsToPence(amount)`

### 3. For Stripe Payments

- Stripe expects amounts in **pence/cents** (integer values)
- Database values are usually already in pence - **DO NOT** multiply again
- If you have a user input value in pounds, use `poundsToPence(amount)` to convert

### 4. Debugging Currency Issues

Use the debug method to log and verify values:

```typescript
import { debugCurrencyInfo } from '@/services/CurrencyService';

// For database values (in pence)
debugCurrencyInfo(amount, 'Payment amount from database', true);

// For user input values (in pounds)
debugCurrencyInfo(amount, 'User input amount', false);
```

### 5. Data Flow for Currency Values

**CRITICAL**: Follow this flow to avoid double conversion errors

1. **Database → UI Display**:
   - Retrieve value from DB (in pence)
   - Pass directly to UI components
   - Use `formatCurrency(amount)` in the UI component for display

2. **User Input → Database**:
   - Capture user input (in pounds)
   - Use `poundsToPence(amount)` before storing in DB

3. **Database → API Call**:
   - Retrieve value from DB (in pence)
   - Pass directly to API without any conversion (most APIs like Stripe expect pence/cents)

## Example Flow: Processing a Payment

```typescript
// 1. Retrieve amount from database/API (in pence)
const paymentAmountInPence = linkData.amount; // e.g., 1000 (£10.00)

// 2. Validate it to catch potential errors
validatePenceAmount(paymentAmountInPence, 'PaymentProcessing');

// 3. Display it in the UI
<span>{formatCurrency(paymentAmountInPence)}</span> // Shows "£10.00"

// 4. Send to Stripe (already in pence/cents)
const paymentIntent = await stripe.paymentIntents.create({
  amount: paymentAmountInPence, // ALREADY IN PENCE - DO NOT MULTIPLY BY 100
  currency: "gbp"
});
```

## Example Flow: User Input Amount

```typescript
// 1. User enters an amount (in pounds)
const userInputAmount = 10.50; // £10.50

// 2. Validate it
validatePoundsAmount(userInputAmount, 'UserInputValidation');

// 3. Display it in the UI
<span>{formatUserInputCurrency(userInputAmount)}</span> // Shows "£10.50"

// 4. Convert to pence for database storage
const amountInPence = poundsToPence(userInputAmount); // 1050

// 5. Save to database
await db.savePayment({ amount: amountInPence }); // Stores 1050 (not 105000!)
```

## NEVER DO THIS - Common Mistakes to Avoid

```typescript
// MISTAKE 1: Double conversion
// First converting in a formatter function
const plan = {
  ...dbPlan,
  amount: dbPlan.amount / 100, // WRONG! Don't convert here if using formatCurrency later
};
// Then formatting again in UI
<span>{formatCurrency(plan.amount)}</span> // This divides by 100 AGAIN!

// MISTAKE 2: Converting directly in JSX
// The database value is in pence (e.g., 1000)
<span>£{(payment.amount / 100).toFixed(2)}</span> // WRONG! Use formatCurrency instead
```
