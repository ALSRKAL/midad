/**
 * Arabic-aware text normalization, used for search and for the denormalized catalog columns.
 *
 * Learning platform search has to survive how people actually type Arabic: without hamza, without
 * tashkeel, with ة written as ه, with ى written as ي, sometimes with Arabic-Indic digits. The same
 * function is applied when indexing (course title/description) and when querying, so both sides fold
 * identically — the product requirements.
 *
 * Pure and dependency-free on purpose: it is unit-tested directly (tests/unit/lib/search-normalize).
 */

/** Tashkeel (harakat), tatweel (kashida) and Quranic marks that carry no search meaning. */
const TASHKEEL_AND_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Alef variants (ا أ إ آ ٱ) all fold to a bare alef. */
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/g;

/** Latin diacritics stripped so "café" and "cafe" match. */
const LATIN_DIACRITICS = /[\u0300-\u036F]/g;

export function normalizeText(input: string): string {
  return (
    input
      .normalize("NFKD")
      // Arabic shaping and punctuation variants
      .replace(TASHKEEL_AND_MARKS, "")
      .replace(ALEF_VARIANTS, "\u0627")
      .replace(/\u0629/g, "\u0647") // ة → ه
      .replace(/\u0649/g, "\u064A") // ى → ي
      .replace(/\u0624/g, "\u0648") // ؤ → و
      .replace(/\u0626/g, "\u064A") // ئ → ي
      // digits
      .replace(ARABIC_INDIC_DIGITS, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) - 0x0660 + 0x0030),
      )
      .replace(EXTENDED_ARABIC_INDIC_DIGITS, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) - 0x06f0 + 0x0030),
      )
      // latin casing and accents
      .replace(LATIN_DIACRITICS, "")
      .toLowerCase()
      // unify whitespace and strip punctuation that only adds noise to matching
      .replace(/[\u060C\u061B\u061F.,!?;:()"[\]{}«»'"“”‘’/\\|_*+~^%$#@&<>=-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Normalizes a bilingual pair into one search string: an Arabic query must find a course whose
 * title is only stored in Arabic, and an English query must find the same course by its English
 * title. Both languages live in the same normalized column.
 */
export function normalizeBilingual(...parts: Array<string | null | undefined>): string {
  return normalizeText(parts.filter((part): part is string => Boolean(part)).join(" "));
}

/** True when `haystack` (already normalized) contains the normalized `needle`. */
export function normalizedIncludes(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalizeText(needle);
  if (normalizedNeedle.length === 0) return false;
  return normalizeText(haystack).includes(normalizedNeedle);
}
