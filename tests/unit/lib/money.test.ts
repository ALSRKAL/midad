import { describe, expect, it } from "vitest";

import {
  add,
  applyBps,
  applyPercent,
  clampDiscount,
  formatMoney,
  formatMoneyCents,
  money,
  mulDivRoundHalfEven,
  parseMoneyInput,
  quote,
  sub,
  sum,
} from "@/lib/money";

const SAR = "SAR" as const;
const USD = "USD" as const;

describe("BR-05: money is integer minor units", () => {
  it("rejects a non-integer amount", () => {
    expect(() => money(19.5, SAR)).toThrow(/integer/);
  });

  it("refuses to combine different currencies", () => {
    expect(() => add(money(100, SAR), money(100, USD))).toThrow(/SAR with USD/);
    expect(() => sub(money(100, SAR), money(100, USD))).toThrow(/SAR with USD/);
  });

  it("adds, subtracts and sums within one currency", () => {
    expect(add(money(19900, SAR), money(100, SAR)).amount).toBe(20000);
    expect(sub(money(19900, SAR), money(9900, SAR)).amount).toBe(10000);
    expect(sum([money(100, SAR), money(250, SAR), money(1, SAR)], SAR).amount).toBe(351);
  });
});

describe("BR-06: banker's rounding (half to even)", () => {
  it("rounds 0.5 down to the even neighbour", () => {
    // 1.5 -> 2 (even), 2.5 -> 2 (even), 3.5 -> 4 (even)
    expect(mulDivRoundHalfEven(1500, 1, 1000)).toBe(2);
    expect(mulDivRoundHalfEven(2500, 1, 1000)).toBe(2);
    expect(mulDivRoundHalfEven(3500, 1, 1000)).toBe(4);
  });

  it("rounds half away when the even neighbour is upward", () => {
    expect(mulDivRoundHalfEven(5, 5, 10)).toBe(2); // 2.5 -> 2
    expect(mulDivRoundHalfEven(7, 5, 10)).toBe(4); // 3.5 -> 4
  });

  it("does not round values below the halfway point", () => {
    expect(mulDivRoundHalfEven(1499, 1, 1000)).toBe(1);
    expect(mulDivRoundHalfEven(1400, 1, 1000)).toBe(1);
  });

  it("rounds values above the halfway point up", () => {
    expect(mulDivRoundHalfEven(1501, 1, 1000)).toBe(2);
    expect(mulDivRoundHalfEven(999, 1, 1)).toBe(999);
  });

  it("handles negative amounts symmetrically (ledger entries)", () => {
    expect(mulDivRoundHalfEven(-1500, 1, 1000)).toBe(-2);
    expect(mulDivRoundHalfEven(-2500, 1, 1000)).toBe(-2);
    expect(mulDivRoundHalfEven(-3500, 1, 1000)).toBe(-4);
  });

  it("rejects a zero denominator", () => {
    expect(() => mulDivRoundHalfEven(100, 1, 0)).toThrow(/denominator/);
  });

  it("VAT 15% on 99.99 SAR rounds to 15.00", () => {
    expect(applyBps(money(9999, SAR), 1500).amount).toBe(1500);
  });

  it("VAT 15% on 199.00 SAR is 29.85", () => {
    expect(applyBps(money(19900, SAR), 1500).amount).toBe(2985);
  });

  it("VAT 15% on 0.01 SAR rounds half to even (0.0015 -> 0)", () => {
    expect(applyBps(money(1, SAR), 1500).amount).toBe(0);
  });

  it("applies a percentage discount with the same rounding", () => {
    expect(applyPercent(money(19900, SAR), 15).amount).toBe(2985);
    expect(applyPercent(money(100, SAR), 100).amount).toBe(100);
    expect(applyPercent(money(100, SAR), 0).amount).toBe(0);
  });

  it("rejects a percentage outside 1..100 (0 is allowed as no discount only via coupon rules)", () => {
    expect(() => applyPercent(money(100, SAR), 101)).toThrow(/between 0 and 100/);
    expect(() => applyPercent(money(100, SAR), -1)).toThrow(/between 0 and 100/);
  });
});

describe("BR-07: a discount never makes a line negative", () => {
  it("caps a discount at the line price", () => {
    expect(clampDiscount(money(9900, SAR), money(50000, SAR)).amount).toBe(9900);
  });

  it("floors a negative discount at zero", () => {
    expect(clampDiscount(money(9900, SAR), money(-500, SAR)).amount).toBe(0);
  });

  it("leaves a smaller discount untouched", () => {
    expect(clampDiscount(money(9900, SAR), money(1500, SAR)).amount).toBe(1500);
  });
});

describe("BR-06: the canonical pricing order", () => {
  it("computes subtotal, discount, tax and total in that order", () => {
    const result = quote([{ unitPriceCents: 19900, discountCents: 2985 }], {
      currency: SAR,
      vatBps: 1500,
    });

    expect(result.subtotalCents).toBe(19900);
    expect(result.discountCents).toBe(2985);
    expect(result.taxableCents).toBe(16915);
    expect(result.taxCents).toBe(2537); // 16915 * 0.15 = 2537.25 -> 2537
    expect(result.totalCents).toBe(19452);
  });

  it("never taxes the discount", () => {
    const withDiscount = quote([{ unitPriceCents: 10000, discountCents: 10000 }], {
      currency: SAR,
      vatBps: 1500,
    });
    expect(withDiscount.taxCents).toBe(0);
    expect(withDiscount.totalCents).toBe(0);
  });

  it("a 100% percentage coupon yields a zero total", () => {
    const price = 25000;
    const discount = applyPercent(money(price, SAR), 100).amount;
    const result = quote([{ unitPriceCents: price, discountCents: discount }], {
      currency: SAR,
      vatBps: 1500,
    });
    expect(result.discountCents).toBe(price);
    expect(result.totalCents).toBe(0);
  });

  it("a fixed discount larger than the price floors at zero, not negative", () => {
    const result = quote([{ unitPriceCents: 5000, discountCents: 99999 }], {
      currency: SAR,
      vatBps: 1500,
    });
    expect(result.discountCents).toBe(5000);
    expect(result.totalCents).toBe(0);
  });

  it("sums multi-line carts and keeps line totals equal to the document total", () => {
    const result = quote(
      [
        { unitPriceCents: 19900, discountCents: 2985 },
        { unitPriceCents: 9900, discountCents: 0 },
        { unitPriceCents: 49900, discountCents: 5000 },
      ],
      { currency: SAR, vatBps: 1500 },
    );

    expect(result.subtotalCents).toBe(79700);
    expect(result.discountCents).toBe(7985);
    expect(result.taxableCents).toBe(71715);
    expect(result.taxCents).toBe(10757);
    expect(result.totalCents).toBe(result.taxableCents + result.taxCents);

    const lineTotals = result.lines.reduce((total, line) => total + line.totalCents, 0);
    expect(lineTotals).toBe(result.totalCents);
  });

  it("supports a zero-VAT configuration", () => {
    const result = quote([{ unitPriceCents: 19900 }], { currency: SAR, vatBps: 0 });
    expect(result.taxCents).toBe(0);
    expect(result.totalCents).toBe(19900);
  });

  it("works in USD with cents", () => {
    const result = quote([{ unitPriceCents: 4999, discountCents: 1000 }], {
      currency: USD,
      vatBps: 0,
    });
    expect(result.currency).toBe(USD);
    expect(result.totalCents).toBe(3999);
  });

  it("rejects a negative unit price", () => {
    expect(() => quote([{ unitPriceCents: -1 }], { currency: SAR, vatBps: 1500 })).toThrow(
      /negative/,
    );
  });

  it("returns an empty quote for an empty cart", () => {
    const result = quote([], { currency: SAR, vatBps: 1500 });
    expect(result.totalCents).toBe(0);
    expect(result.lines).toHaveLength(0);
  });
});

describe("money input parsing", () => {
  it("parses whole amounts", () => {
    expect(parseMoneyInput("199", SAR)).toBe(19900);
  });

  it("parses decimals with one or two places", () => {
    expect(parseMoneyInput("199.5", SAR)).toBe(19950);
    expect(parseMoneyInput("199.05", SAR)).toBe(19905);
  });

  it("accepts thousands separators", () => {
    expect(parseMoneyInput("1,234.56", SAR)).toBe(123456);
  });

  it("accepts Arabic-Indic digits", () => {
    expect(parseMoneyInput("١٩٩", SAR)).toBe(19900);
  });

  it("accepts the Arabic decimal separator", () => {
    expect(parseMoneyInput("١٢٣٫٤٥", SAR)).toBe(12345);
  });

  it("rejects more precision than the currency allows instead of rounding", () => {
    expect(() => parseMoneyInput("199.999", SAR)).toThrow(/decimal places/);
  });

  it("rejects non-numeric input", () => {
    expect(() => parseMoneyInput("abc", SAR)).toThrow(/valid amount/);
    expect(() => parseMoneyInput("", SAR)).toThrow(/valid amount/);
  });
});

describe("money formatting", () => {
  it("formats Arabic with Latin digits and the Arabic currency symbol", () => {
    const formatted = formatMoney(money(19900, SAR), "ar");
    expect(formatted).toContain("199");
    expect(formatted).toContain("ر.س");
  });

  it("formats English with the ISO code", () => {
    const formatted = formatMoney(money(19900, SAR), "en");
    expect(formatted).toContain("199");
    expect(formatted).toContain("SAR");
  });

  it("shows decimals for non-whole amounts", () => {
    expect(formatMoney(money(19950, SAR), "en")).toMatch(/199\.50/);
  });

  it("can force decimals for whole amounts", () => {
    expect(formatMoney(money(19900, SAR), "en", { showDecimals: true })).toMatch(/199\.00/);
  });

  it("formats cents for stable display in tables", () => {
    expect(formatMoneyCents(19900, SAR)).toBe("199.00 SAR");
    expect(formatMoneyCents(5, USD)).toBe("0.05 USD");
    expect(formatMoneyCents(-2500, SAR)).toBe("-25.00 SAR");
  });
});
