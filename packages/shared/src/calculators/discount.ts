export interface DiscountResult {
  discountAmount: number;
  finalPrice: number;
  savingsPercent: number;
}

/**
 * Computes a discounted price given an original price and a discount
 * percentage. Discounts above 100% are allowed mathematically (they would
 * produce a negative final price); callers should validate the percentage
 * range (0–100) before calling this if a negative final price should be
 * rejected rather than displayed.
 */
export function calculateDiscount(originalPrice: number, discountPercent: number): DiscountResult {
  const discountAmount = originalPrice * (discountPercent / 100);
  const finalPrice = originalPrice - discountAmount;
  const savingsPercent = discountPercent;
  return { discountAmount, finalPrice, savingsPercent };
}
