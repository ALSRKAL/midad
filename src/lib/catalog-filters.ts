/**
 * Catalog filter contract (the product requirements).
 *
 * The URL is the state: every filter, the sort and the page live in search params, so a filtered
 * catalog can be bookmarked, shared and rendered on the server. Parsing is defensive — a malformed
 * `?page=abc` falls back to the defaults rather than throwing a 500 at a visitor.
 *
 * Pure and unit-tested; the page and the query service both consume these types.
 */

import { z } from "zod";

export const CATALOG_PAGE_SIZE = 12;

export const CATALOG_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"] as const;
export const CATALOG_SORTS = ["newest", "popular", "rating", "price-asc", "price-desc"] as const;

export const catalogFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  level: z.enum(CATALOG_LEVELS).optional(),
  price: z.enum(["free", "paid"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  language: z.enum(["AR", "EN"]).optional(),
  sort: z.enum(CATALOG_SORTS).default("newest"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export const EMPTY_CATALOG_FILTERS: CatalogFilters = { sort: "newest", page: 1 };

/** Keeps only scalar, non-empty params, then validates. Invalid input resets to the defaults. */
export function parseCatalogFilters(
  raw: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const scalar: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") scalar[key] = value;
  }

  const parsed = catalogFiltersSchema.safeParse(scalar);
  return parsed.success ? parsed.data : EMPTY_CATALOG_FILTERS;
}

/** True when anything narrows the result set; the empty state uses it to offer "clear filters". */
export function hasActiveCatalogFilters(filters: CatalogFilters): boolean {
  return (
    filters.q !== undefined ||
    filters.category !== undefined ||
    filters.level !== undefined ||
    filters.price !== undefined ||
    filters.rating !== undefined ||
    filters.duration !== undefined ||
    filters.language !== undefined
  );
}

/**
 * Builds a locale-agnostic catalog path. Defaults are omitted so the canonical URL stays short and
 * one result set never has two addresses.
 */
export function buildCatalogHref(
  filters: CatalogFilters,
  overrides: Partial<CatalogFilters> = {},
): string {
  const merged: CatalogFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q !== undefined && merged.q !== "") params.set("q", merged.q);
  if (merged.category !== undefined) params.set("category", merged.category);
  if (merged.level !== undefined) params.set("level", merged.level);
  if (merged.price !== undefined) params.set("price", merged.price);
  if (merged.rating !== undefined) params.set("rating", String(merged.rating));
  if (merged.duration !== undefined) params.set("duration", merged.duration);
  if (merged.language !== undefined) params.set("language", merged.language);
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));

  const query = params.toString();
  return query === "" ? "/courses" : `/courses?${query}`;
}
