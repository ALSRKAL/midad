/**
 * Slug generation for admin category URLs.
 *
 * Latin-based on purpose: URLs stay stable and readable even when the visible names are Arabic.
 * Arabic text cannot be transliterated reliably without a dictionary, so the admin enters an English
 * name and this function derives the slug; collisions are refused, never silently suffixed.
 */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
