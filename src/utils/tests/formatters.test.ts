
// Unit tests for formatters utility functions
// Run with: npm test -- formatters.test.ts

import { formatCurrency } from '../formatters';

describe('formatCurrency', () => {
  // Test amounts already in pounds/dollars
  test('formats regular decimal amounts correctly', () => {
    expect(formatCurrency(10)).toBe('£10.00');
    expect(formatCurrency(10.5)).toBe('£10.50');
    expect(formatCurrency(100)).toBe('£100.00');
    expect(formatCurrency(1000)).toBe('£1000.00');
    expect(formatCurrency(1000.50)).toBe('£1000.50');
    expect(formatCurrency(10000)).toBe('£10000.00');
  });

  // Test amounts in cents that need conversion
  test('formats cent amounts correctly', () => {
    expect(formatCurrency(1050)).toBe('£10.50');
    expect(formatCurrency(10050)).toBe('£100.50');
    expect(formatCurrency(100050)).toBe('£1000.50');
  });

  // Test edge cases
  test('handles edge cases correctly', () => {
    expect(formatCurrency(0)).toBe('£0.00');
    expect(formatCurrency(null)).toBe('£0.00');
    expect(formatCurrency(undefined)).toBe('£0.00');
    expect(formatCurrency(-10.5)).toBe('£-10.50');
    expect(formatCurrency(-1050)).toBe('£-10.50');
  });

  // Test with different currencies
  test('formats with different currency symbols', () => {
    expect(formatCurrency(10.5, '$')).toBe('$10.50');
    expect(formatCurrency(1050, '€')).toBe('€10.50');
  });

  // Test the specific bug case with amounts >= 100000 cents
  test('correctly handles large amounts (previously buggy)', () => {
    expect(formatCurrency(100000)).toBe('£1000.00');
    expect(formatCurrency(500000)).toBe('£5000.00');
    expect(formatCurrency(1000000)).toBe('£10000.00');
  });

  // Test multiples of 100 (which should not be converted)
  test('correctly handles multiples of 100', () => {
    expect(formatCurrency(100)).toBe('£100.00');
    expect(formatCurrency(1100)).toBe('£11.00');  // This is 11.00 in cents
    expect(formatCurrency(10000)).toBe('£10000.00'); // Already in pounds
  });
});
