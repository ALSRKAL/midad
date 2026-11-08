import { mulDivRoundHalfEven } from "@/lib/money";

/**
 * Instructor share (BR-11), pure.
 *
 * The share is the commission rate applied to the post-discount, pre-tax line amount, using the same
 * banker's rounding as every other money operation. The result is frozen on the order line at sale
 * time by the checkout transaction.
 */
export function instructorShareCents(taxableCents: number, commissionBps: number): number {
  if (!Number.isInteger(taxableCents) || taxableCents < 0) {
    throw new Error("taxableCents must be a non-negative integer");
  }
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10_000) {
    throw new Error("commissionBps must be an integer between 0 and 10000");
  }
  return mulDivRoundHalfEven(taxableCents, commissionBps, 10_000);
}
