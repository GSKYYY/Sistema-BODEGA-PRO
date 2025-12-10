
import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const MathUtils = {
  // Add two numbers
  add: (a: number, b: number): number => {
    return new Decimal(a).plus(b).toNumber();
  },

  // Subtract b from a
  sub: (a: number, b: number): number => {
    return new Decimal(a).minus(b).toNumber();
  },

  // Multiply
  mul: (a: number, b: number): number => {
    return new Decimal(a).times(b).toNumber();
  },

  // Divide
  div: (a: number, b: number): number => {
    if (b === 0) return 0;
    return new Decimal(a).div(b).toNumber();
  },

  // Calculate percentage amount (e.g. 16% of 100 = 16)
  percent: (amount: number, percentage: number): number => {
    return new Decimal(amount).times(percentage).div(100).toNumber();
  },

  // Round to 2 decimals
  round: (val: number): number => {
    return new Decimal(val).toDecimalPlaces(2).toNumber();
  }
};
