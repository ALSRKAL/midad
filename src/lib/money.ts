/**
 * Money handling (BR-05, BR-06).
 *
 * Every amount is an integer in the currency's minor unit (halala / cent). Floats are never used for
 * money: `0.1 + 0.2` is not a rounding nuisance in a checkout, it is a wrong price. Rounding is
 * banker's rounding (half to even), implemented with exact integer arithmetic.
 *
 * This module is pure and shared by the client (display) and the server (authoritative pricing).
 */

import { currencyFractionDigits, intlLocales, type Currency, type Locale } from "@/config/site";

export type Money = { readonly amount: number; readonly currency: Currency };

export function money(amount: number, currency: Currency): Money {
  assertInteger(amount, "amount");
  return { amount, currency };
}

export function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer in minor units, received ${value}`);
  }
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Refusing to combine ${a.currency} with ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function sub(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function sum(values: readonly Money[], currency: Currency): Money {
  return values.reduce<Money>((total, value) => add(total, value), money(0, currency));
}

export function isZero(value: Money): boolean {
  return value.amount === 0;
}

/**
 * Multiplies an integer amount by a rational rate and rounds half-to-even.
 *
 * `mulDivRoundHalfEven(19900, 1500, 10000)` = 2985 (15% VAT on 199.00 SAR).
 * Implemented with BigInt so large catalogues cannot overflow the 53-bit float mantissa.
 */
export function mulDivRoundHalfEven(value: number, numerator: number, denominator: number): number {
  assertInteger(value, "value");
  assertInteger(numerator, "numerator");
  assertInteger(denominator, "denominator");
  if (denominator === 0) throw new Error("denominator must not be zero");

  const negative = value < 0 !== (numerator < 0 !== denominator < 0);
  const absValue = BigInt(Math.abs(value));
  const absNumerator = BigInt(Math.abs(numerator));
  const absDenominator = BigInt(Math.abs(denominator));

  const product = absValue * absNumerator;
  const quotient = product / absDenominator;
  const remainder = product % absDenominator;

  const twiceRemainder = remainder * 2n;
  let rounded = quotient;
  if (twiceRemainder > absDenominator) {
    rounded += 1n;
  } else if (twiceRemainder === absDenominator) {
    // Halfway: round to the even neighbour.
    if (quotient % 2n === 1n) rounded += 1n;
  }

  const result = Number(rounded);
  return negative ? -result : result;
}

/** Applies a basis-point rate (1500 = 15%). */
export function applyBps(value: Money, bps: number): Money {
  return money(mulDivRoundHalfEven(value.amount, bps, 10_000), value.currency);
}

/** Applies a percentage (1–100) to an amount. */
export function applyPercent(value: Money, percent: number): Money {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error(`percent must be an integer between 0 and 100, received ${percent}`);
  }
  return money(mulDivRoundHalfEven(value.amount, percent, 100), value.currency);
}

/** Clamps a discount so a line can never become negative (BR-07). */
export function clampDiscount(price: Money, discount: Money): Money {
  assertSameCurrency(price, discount);
  const capped = Math.min(price.amount, Math.max(0, discount.amount));
  return money(capped, price.currency);
}

/* ------------------------------------------------------------------ *
 * Quote (the single pricing order, BR-06)                             *
 * ------------------------------------------------------------------ */

export type QuoteLineInput = {
  /** Unit price of the line in minor units. */
  unitPriceCents: number;
  /** Discount applied to this line, already evaluated by the coupon rules. */
  discountCents?: number;
};

export type Quote = {
  currency: Currency;
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
  lines: Array<{
    unitPriceCents: number;
    discountCents: number;
    taxableCents: number;
    taxCents: number;
    totalCents: number;
  }>;
};

/**
 * Canonical order: subtotal → coupon discount → taxable subtotal → VAT on the taxable subtotal → total.
 * Rounding happens per line so the sum of the lines always equals the document total; a shopper can
 * add up the invoice and get the same number.
 */
export function quote(
  items: readonly QuoteLineInput[],
  options: { currency: Currency; vatBps: number },
): Quote {
  const { currency, vatBps } = options;

  const lines = items.map((item) => {
    assertInteger(item.unitPriceCents, "unitPriceCents");
    if (item.unitPriceCents < 0) throw new Error("unitPriceCents must not be negative");

    const discountCents = clampDiscount(
      money(item.unitPriceCents, currency),
      money(item.discountCents ?? 0, currency),
    ).amount;
    const taxableCents = item.unitPriceCents - discountCents;
    const taxCents = mulDivRoundHalfEven(taxableCents, vatBps, 10_000);

    return {
      unitPriceCents: item.unitPriceCents,
      discountCents,
      taxableCents,
      taxCents,
      totalCents: taxableCents + taxCents,
    };
  });

  const subtotalCents = lines.reduce((total, line) => total + line.unitPriceCents, 0);
  const discountCents = lines.reduce((total, line) => total + line.discountCents, 0);
  const taxableCents = lines.reduce((total, line) => total + line.taxableCents, 0);
  const taxCents = lines.reduce((total, line) => total + line.taxCents, 0);

  return {
    currency,
    subtotalCents,
    discountCents,
    taxableCents,
    taxCents,
    totalCents: taxableCents + taxCents,
    lines,
  };
}

/* ------------------------------------------------------------------ *
 * Parsing and formatting                                              *
 * ------------------------------------------------------------------ */

const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;

/**
 * Parses user input ("199", "199.5", "1,234.56", Arabic-Indic digits) into minor units.
 * Rejects more precision than the currency allows instead of silently rounding money.
 */
export function parseMoneyInput(input: string, currency: Currency): number {
  const normalised = input
    .trim()
    .replace(ARABIC_INDIC, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0x0660 + 0x30))
    .replace(EXTENDED_ARABIC_INDIC, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0x06f0 + 0x30),
    )
    .replace(/[,\u066C\s]/g, "")
    .replace(/[\u066B]/g, ".");

  if (!/^-?\d+(\.\d+)?$/.test(normalised)) {
    throw new Error(`Not a valid amount: ${input}`);
  }

  const digits = currencyFractionDigits[currency];
  const [wholePart, fractionPart = ""] = normalised.replace("-", "").split(".");

  if (fractionPart.length > digits) {
    throw new Error(`Too many decimal places for ${currency}: ${input}`);
  }

  const padded = fractionPart.padEnd(digits, "0");
  const amount = Number(`${wholePart ?? "0"}${padded}`);
  return normalised.startsWith("-") ? -amount : amount;
}

/** Formats a Money value with Intl, using the locale's numbering system and currency placement. */
export function formatMoney(
  value: Money,
  locale: Locale,
  options?: { showDecimals?: boolean },
): string {
  const digits = currencyFractionDigits[value.currency];
  const isWhole = value.amount % 10 ** digits === 0;
  const showDecimals = options?.showDecimals ?? !isWhole;

  return new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: showDecimals ? digits : 0,
    maximumFractionDigits: showDecimals ? digits : 0,
  }).format(value.amount / 10 ** digits);
}

/** Display helper for codes and inputs: always Latin digits, always LTR (the product requirements). */
export function formatMoneyCents(amount: number, currency: Currency): string {
  const digits = currencyFractionDigits[currency];
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / 10 ** digits);
  const fraction = abs % 10 ** digits;
  return `${sign}${whole}.${String(fraction).padStart(digits, "0")} ${currency}`;
}
