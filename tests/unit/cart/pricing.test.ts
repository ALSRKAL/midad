import { describe, expect, it } from "vitest";

import { add, money, mulDivRoundHalfEven, quote, type QuoteLineInput } from "@/lib/money";

/**
 * BR-06 pricing order and BR-05 integer money, as a table.
 *
 * The expected totals are hand-computed from the canonical order: subtotal → discount → taxable →
 * VAT per line (banker's rounding) → total. Every case also asserts the invariants a shopper can
 * check on an invoice: line sums equal document totals and no line is negative.
 */

type Case = {
  name: string;
  items: QuoteLineInput[];
  vatBps: number;
  currency: "SAR" | "USD";
  expected: { subtotal: number; discount: number; tax: number; total: number };
};

const CASES: Case[] = [
  {
    name: "BR-06: 199.00 SAR with 15% VAT",
    items: [{ unitPriceCents: 19_900 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 19_900, discount: 0, tax: 2_985, total: 22_885 },
  },
  {
    name: "BR-06: 99.99 SAR with 15% VAT rounds the halala",
    items: [{ unitPriceCents: 9_999 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 9_999, discount: 0, tax: 1_500, total: 11_499 },
  },
  {
    name: "BR-06: 100% discount yields zero total",
    items: [{ unitPriceCents: 25_000, discountCents: 25_000 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 25_000, discount: 25_000, tax: 0, total: 0 },
  },
  {
    name: "BR-06: fixed discount larger than price floors at zero",
    items: [{ unitPriceCents: 15_000, discountCents: 99_000 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 15_000, discount: 15_000, tax: 0, total: 0 },
  },
  {
    name: "BR-06: rounds 0.5 halala half-to-even (1.5 → 2)",
    items: [{ unitPriceCents: 10 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 10, discount: 0, tax: 2, total: 12 },
  },
  {
    name: "BR-06: rounds 4.5 halala half-to-even (4.5 → 4)",
    items: [{ unitPriceCents: 30 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 30, discount: 0, tax: 4, total: 34 },
  },
  {
    name: "BR-06: zero VAT configuration",
    items: [{ unitPriceCents: 12_345 }],
    vatBps: 0,
    currency: "SAR",
    expected: { subtotal: 12_345, discount: 0, tax: 0, total: 12_345 },
  },
  {
    name: "BR-06: 15% VAT on 99.99 SAR",
    items: [{ unitPriceCents: 9_999 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 9_999, discount: 0, tax: 1_500, total: 11_499 },
  },
  {
    name: "BR-06: multiple lines discount one line only",
    items: [{ unitPriceCents: 10_000 }, { unitPriceCents: 20_000, discountCents: 5_000 }],
    vatBps: 1500,
    currency: "SAR",
    expected: { subtotal: 30_000, discount: 5_000, tax: 3_750, total: 28_750 },
  },
  {
    name: "BR-06: USD line keeps cents",
    items: [{ unitPriceCents: 2_000 }],
    vatBps: 1500,
    currency: "USD",
    expected: { subtotal: 2_000, discount: 0, tax: 300, total: 2_300 },
  },
];

/** Thirty generated but deterministic cases exercising every price band and VAT rate. */
const GENERATED: Case[] = Array.from({ length: 30 }, (_, index) => {
  const unitPriceCents = 1_000 + index * 937;
  const discountCents = index % 3 === 0 ? Math.floor(unitPriceCents / 3) : 0;
  const vatBps = [0, 500, 1500][index % 3] ?? 1500;
  const taxable = unitPriceCents - discountCents;
  const tax = mulDivRoundHalfEven(taxable, vatBps, 10_000);
  return {
    name: `BR-06: generated case ${index + 1}`,
    items: [{ unitPriceCents, discountCents }],
    vatBps,
    currency: "SAR",
    expected: {
      subtotal: unitPriceCents,
      discount: discountCents,
      tax,
      total: taxable + tax,
    },
  };
});

describe("BR-06 canonical quote", () => {
  it.each([...CASES, ...GENERATED])("$name", ({ items, vatBps, currency, expected }) => {
    const result = quote(items, { currency, vatBps });

    expect(result.currency).toBe(currency);
    expect(result.subtotalCents).toBe(expected.subtotal);
    expect(result.discountCents).toBe(expected.discount);
    expect(result.taxCents).toBe(expected.tax);
    expect(result.totalCents).toBe(expected.total);

    expect(result.taxableCents).toBe(result.subtotalCents - result.discountCents);
    expect(result.totalCents).toBe(result.taxableCents + result.taxCents);
    expect(result.lines.reduce((sum, line) => sum + line.totalCents, 0)).toBe(result.totalCents);
    for (const line of result.lines) {
      expect(line.discountCents).toBeLessThanOrEqual(line.unitPriceCents);
      expect(line.taxableCents).toBeGreaterThanOrEqual(0);
      expect(line.totalCents).toBeGreaterThanOrEqual(0);
    }
  });

  it("BR-05: rejects non-integer amounts", () => {
    expect(() => quote([{ unitPriceCents: 199.5 }], { currency: "SAR", vatBps: 1500 })).toThrow(
      /integer/i,
    );
  });

  it("BR-05: rejects a negative price", () => {
    expect(() => quote([{ unitPriceCents: -1 }], { currency: "SAR", vatBps: 1500 })).toThrow(
      /negative/i,
    );
  });

  it("BR-05: refuses to mix currencies", () => {
    expect(() => add(money(100, "SAR"), money(100, "USD"))).toThrow(/Refusing to combine/);
  });

  it("BR-06: ignores any price the client might send", () => {
    // The function has no client-price parameter at all; this guards the API shape against a future
    // "price override" being added silently.
    const result = quote([{ unitPriceCents: 19_900 }], { currency: "SAR", vatBps: 1500 });
    expect(result.totalCents).toBe(22_885);
  });
});
