import { describe, expect, it } from "vitest";

import { availablePayoutCents, payoutRequestError } from "@/lib/payout-rules";

/** BR-11/12/13 payout arithmetic. */

describe("payout rules", () => {
  it("BR-13: available balance subtracts paid and pending payouts and never goes negative", () => {
    expect(
      availablePayoutCents({
        eligibleNetCents: 50_000,
        paidPayoutCents: 10_000,
        pendingPayoutCents: 15_000,
      }),
    ).toBe(25_000);
    expect(
      availablePayoutCents({
        eligibleNetCents: 5_000,
        paidPayoutCents: 10_000,
        pendingPayoutCents: 0,
      }),
    ).toBe(0);
  });

  it("BR-13: enforces the minimum, the available ceiling and one pending request", () => {
    const base = { availableCents: 20_000, minimumCents: 10_000, pendingExists: false };
    expect(payoutRequestError({ ...base, amountCents: 10_000 })).toBeNull();
    expect(payoutRequestError({ ...base, amountCents: 9_999 })).toBe("AMOUNT_BELOW_MINIMUM");
    expect(payoutRequestError({ ...base, amountCents: 20_001 })).toBe("AMOUNT_EXCEEDS_AVAILABLE");
    expect(payoutRequestError({ ...base, amountCents: 0 })).toBe("INVALID_AMOUNT");
    expect(payoutRequestError({ ...base, amountCents: 1.5 })).toBe("INVALID_AMOUNT");
    expect(payoutRequestError({ ...base, amountCents: 15_000, pendingExists: true })).toBe(
      "PENDING_PAYOUT_EXISTS",
    );
  });
});
