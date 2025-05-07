
// Unit tests for formatters utility functions
// Run with: npm test -- formatters.test.ts

import { describe, test, expect } from 'vitest';
import { formatCurrency, formatUserInputCurrency, validateMonetaryAmount } from '../formatters';

describe('formatCurrency', () => {
  // Test amounts in pence/cents (all divided by 100)
  test('formats pence/cents amounts correctly', () => {
    expect(formatCurrency(1000)).toBe('£10.00'); // 1000p = £10.00
    expect(formatCurrency(1050)).toBe('£10.50'); // 1050p = £10.50
    expect(formatCurrency(10000)).toBe('£100.00'); // 10000p = £100.00
    expect(formatCurrency(100000)).toBe('£1000.00'); // 100000p = £1000.00
    expect(formatCurrency(100050)).toBe('£1000.50'); // 100050p = £1000.50
    expect(formatCurrency(1000000)).toBe('£10000.00'); // 1000000p = £10000.00
  });

  // Test edge cases
  test('handles edge cases correctly', () => {
    expect(formatCurrency(0)).toBe('£0.00');
    expect(formatCurrency(null)).toBe('£0.00');
    expect(formatCurrency(undefined)).toBe('£0.00');
    expect(formatCurrency(-1050)).toBe('£-10.50'); // Negative values
  });

  // Test with different currencies
  test('formats with different currency symbols', () => {
    expect(formatCurrency(1050, '$')).toBe('$10.50');
    expect(formatCurrency(1050, '€')).toBe('€10.50');
    expect(formatCurrency(100000, '$')).toBe('$1000.00');
    expect(formatCurrency(100000, '€')).toBe('€1000.00');
    expect(formatCurrency(1, '¥')).toBe('¥0.01');
  });
});

describe('formatUserInputCurrency', () => {
  // Test amounts in pounds (no division by 100)
  test('formats pound amounts correctly without dividing by 100', () => {
    expect(formatUserInputCurrency(10)).toBe('£10.00'); // £10 = £10.00
    expect(formatUserInputCurrency(10.5)).toBe('£10.50'); // £10.50 = £10.50
    expect(formatUserInputCurrency(100)).toBe('£100.00'); // £100 = £100.00
    expect(formatUserInputCurrency(1000)).toBe('£1000.00'); // £1000 = £1000.00
    expect(formatUserInputCurrency(1000.5)).toBe('£1000.50'); // £1000.50 = £1000.50
  });

  // Test edge cases
  test('handles edge cases correctly', () => {
    expect(formatUserInputCurrency(0)).toBe('£0.00');
    expect(formatUserInputCurrency(null)).toBe('£0.00');
    expect(formatUserInputCurrency(undefined)).toBe('£0.00');
    expect(formatUserInputCurrency(-10.5)).toBe('£-10.50'); // Negative values
  });

  // Test string inputs
  test('handles string inputs correctly', () => {
    expect(formatUserInputCurrency('10')).toBe('£10.00');
    expect(formatUserInputCurrency('10.5')).toBe('£10.50');
    expect(formatUserInputCurrency('1000')).toBe('£1000.00');
    expect(formatUserInputCurrency('invalid')).toBe('£0.00'); // Invalid strings
  });

  // Test with different currencies
  test('formats with different currency symbols', () => {
    expect(formatUserInputCurrency(10.5, '$')).toBe('$10.50');
    expect(formatUserInputCurrency(10.5, '€')).toBe('€10.50');
    expect(formatUserInputCurrency(1000, '$')).toBe('$1000.00');
    expect(formatUserInputCurrency(1000, '€')).toBe('€1000.00');
  });
});

describe('validateMonetaryAmount', () => {
  // Test validation for amounts in pence
  test('validates pence amounts correctly', () => {
    expect(validateMonetaryAmount(1000, 'test', true)).toBe(true); // 1000p (£10) is valid
    expect(validateMonetaryAmount(50, 'test', true)).toBe(true); // 50p is valid but will generate warning
    expect(validateMonetaryAmount(2000000000, 'test', true)).toBe(false); // £20,000,000 in pence is too large
    expect(validateMonetaryAmount(0, 'test', true)).toBe(false); // 0 is below min value
  });
  
  // Test validation for amounts in pounds
  test('validates pound amounts correctly', () => {
    expect(validateMonetaryAmount(10, 'test', false)).toBe(true); // £10 is valid
    expect(validateMonetaryAmount(0.5, 'test', false)).toBe(true); // £0.50 is valid
    expect(validateMonetaryAmount(20000000, 'test', false)).toBe(false); // £20,000,000 is too large
    expect(validateMonetaryAmount(0, 'test', false)).toBe(false); // 0 is below min value
  });
  
  // Test edge cases
  test('handles edge cases correctly', () => {
    expect(validateMonetaryAmount(null, 'test')).toBe(false);
    expect(validateMonetaryAmount(undefined, 'test')).toBe(false);
    expect(validateMonetaryAmount(-100, 'test')).toBe(false); // Negative values are invalid
  });
});
