import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths inside a locale.
 *
 * Next.js renders the *root* `not-found` for URLs that match no route at all, which would lose the
 * localised page and the layout. Routing every unmatched path under `/[locale]` into this file and
 * throwing `notFound()` makes the segment's own `not-found.tsx` render instead — the documented
 * next-intl pattern for localised 404 pages.
 */
export default function CatchAllPage(): never {
  notFound();
}
