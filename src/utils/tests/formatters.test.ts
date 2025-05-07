
// Unit tests for formatters utility functions
// Run with: npm test -- formatters.test.ts

import { describe, test, expect } from 'vitest';
import { formatCurrency } from '../formatters';

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
