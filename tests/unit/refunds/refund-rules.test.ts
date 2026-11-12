import { describe, expect, it } from "vitest";

import { refundEligibility } from "@/lib/refund-rules";

const paidAt = new Date("2026-11-01T00:00:00Z");
const base = {
  status: "PAID" as const,
  paidAt,
  now: new Date("2026-11-10T00:00:00Z"),
  windowDays: 14,
  maxProgressPct: 30,
  progressPcts: [12, 29],
  certificateIssued: false,
  existingRefundStatus: null,
};

describe("BR-10 refund eligibility", () => {
  it("allows a paid order inside 14 days below 30% with no certificate", () => {
    expect(refundEligibility(base)).toEqual({ allowed: true });
    expect(refundEligibility({ ...base, now: new Date("2026-11-15T00:00:00Z") })).toEqual({
      allowed: true,
    });
  });

  it("rejects after the window and at 30% progress", () => {
    expect(refundEligibility({ ...base, now: new Date("2026-11-16T00:00:00Z") })).toEqual({
      allowed: false,
      reason: "WINDOW_EXPIRED",
    });
    expect(refundEligibility({ ...base, progressPcts: [29, 30] })).toEqual({
      allowed: false,
      reason: "PROGRESS_TOO_HIGH",
    });
  });

  it("rejects certificates, unpaid orders and an existing request", () => {
    expect(refundEligibility({ ...base, certificateIssued: true })).toEqual({
      allowed: false,
      reason: "CERTIFICATE_ISSUED",
    });
    expect(refundEligibility({ ...base, status: "PENDING", paidAt: null })).toEqual({
      allowed: false,
      reason: "NOT_PAID",
    });
    expect(refundEligibility({ ...base, existingRefundStatus: "REQUESTED" })).toEqual({
      allowed: false,
      reason: "ALREADY_REQUESTED",
    });
  });

  it("allows a new request after a rejection", () => {
    expect(refundEligibility({ ...base, existingRefundStatus: "REJECTED" })).toEqual({
      allowed: true,
    });
  });
});
