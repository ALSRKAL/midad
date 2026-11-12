import { describe, expect, it } from "vitest";

import {
  buildCatalogHref,
  EMPTY_CATALOG_FILTERS,
  hasActiveCatalogFilters,
  parseCatalogFilters,
} from "@/lib/catalog-filters";

/** Catalog URL state (P03-T02). The URL is the single source of truth for every filter. */

describe("parseCatalogFilters", () => {
  it("returns the defaults for an empty query", () => {
    expect(parseCatalogFilters({})).toEqual({ sort: "newest", page: 1 });
  });

  it("coerces page and rating to integers", () => {
    const filters = parseCatalogFilters({ page: "3", rating: "4" });
    expect(filters.page).toBe(3);
    expect(filters.rating).toBe(4);
  });

  it("trims the search term", () => {
    expect(parseCatalogFilters({ q: "  react  " }).q).toBe("react");
  });

  it("accepts every documented sort and filter value", () => {
    const filters = parseCatalogFilters({
      category: "design",
      level: "INTERMEDIATE",
      price: "paid",
      duration: "medium",
      language: "AR",
      sort: "rating",
    });
    expect(filters).toMatchObject({
      category: "design",
      level: "INTERMEDIATE",
      price: "paid",
      duration: "medium",
      language: "AR",
      sort: "rating",
    });
  });

  it("falls back to the defaults instead of throwing on malformed input", () => {
    expect(parseCatalogFilters({ page: "abc" })).toEqual(EMPTY_CATALOG_FILTERS);
    expect(parseCatalogFilters({ level: "EXPERT" })).toEqual(EMPTY_CATALOG_FILTERS);
    expect(parseCatalogFilters({ rating: "9" })).toEqual(EMPTY_CATALOG_FILTERS);
  });

  it("ignores array params (repeated query keys)", () => {
    const filters = parseCatalogFilters({ q: ["react", "vue"], page: "2" });
    expect(filters.q).toBeUndefined();
    expect(filters.page).toBe(2);
  });
});

describe("hasActiveCatalogFilters", () => {
  it("is false only for the untouched catalog", () => {
    expect(hasActiveCatalogFilters(EMPTY_CATALOG_FILTERS)).toBe(false);
    expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, sort: "popular" })).toBe(false);
    expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, page: 4 })).toBe(false);
  });

  it("is true when a filter narrows the result set", () => {
    expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, q: "react" })).toBe(true);
    expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, price: "free" })).toBe(true);
    expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, rating: 4 })).toBe(true);
  });
});

describe("buildCatalogHref", () => {
  it("returns the bare path when nothing is applied", () => {
    expect(buildCatalogHref(EMPTY_CATALOG_FILTERS)).toBe("/courses");
  });

  it("omits the default sort and the first page", () => {
    expect(buildCatalogHref({ ...EMPTY_CATALOG_FILTERS, sort: "newest", page: 1 })).toBe(
      "/courses",
    );
  });

  it("encodes an Arabic search term", () => {
    const href = buildCatalogHref({ ...EMPTY_CATALOG_FILTERS, q: "تصميم" });
    expect(href.startsWith("/courses?q=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("تصميم");
  });

  it("applies overrides without mutating the input", () => {
    const filters = { ...EMPTY_CATALOG_FILTERS, q: "react" };
    const href = buildCatalogHref(filters, { page: 2 });
    expect(href).toContain("q=react");
    expect(href).toContain("page=2");
    expect(filters.page).toBe(1);
  });

  it("keeps filters when changing the sort", () => {
    const filters = { ...EMPTY_CATALOG_FILTERS, category: "design", level: "BEGINNER" as const };
    const href = buildCatalogHref(filters, { sort: "price-asc" });
    expect(href).toContain("category=design");
    expect(href).toContain("level=BEGINNER");
    expect(href).toContain("sort=price-asc");
  });
});
