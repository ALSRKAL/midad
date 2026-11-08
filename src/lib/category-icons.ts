/**
 * The icon allow-list shared by the admin form, the database guard and the public renderer.
 *
 * Storing a lucide component name (never raw SVG) means a compromised admin row cannot inject
 * markup: unknown values fall back to the book icon.
 */
export const CATEGORY_ICON_NAMES = [
  "Code2",
  "PenTool",
  "Database",
  "Briefcase",
  "Calculator",
  "Languages",
  "Megaphone",
  "GraduationCap",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export function isCategoryIconName(value: string): value is CategoryIconName {
  return (CATEGORY_ICON_NAMES as readonly string[]).includes(value);
}
