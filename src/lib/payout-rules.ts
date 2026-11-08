/**
 * Payout arithmetic (BR-11/12/13), pure.
 *
 * Nothing is stored as a mutable balance: the available figure is derived from eligible sales,
 * refunds, paid payouts and the single pending request. The database still enforces one pending
 * payout per instructor; these helpers make the same rule testable without Prisma.
 */

export function availablePayoutCents(input: {
  eligibleNetCents: number;
  paidPayoutCents: number;
  pendingPayoutCents: number;
}): number {
  return Math.max(0, input.eligibleNetCents - input.paidPayoutCents - input.pendingPayoutCents);
}

export type PayoutRequestError =
  "PENDING_PAYOUT_EXISTS" | "AMOUNT_BELOW_MINIMUM" | "AMOUNT_EXCEEDS_AVAILABLE" | "INVALID_AMOUNT";

export function payoutRequestError(input: {
  amountCents: number;
  availableCents: number;
  minimumCents: number;
  pendingExists: boolean;
}): PayoutRequestError | null {
  if (input.pendingExists) return "PENDING_PAYOUT_EXISTS";
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) return "INVALID_AMOUNT";
  if (input.amountCents < input.minimumCents) return "AMOUNT_BELOW_MINIMUM";
  if (input.amountCents > input.availableCents) return "AMOUNT_EXCEEDS_AVAILABLE";
  return null;
}
