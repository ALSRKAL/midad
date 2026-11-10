import {
  BookOpen,
  Briefcase,
  Calculator,
  Code2,
  Database,
  GraduationCap,
  Languages,
  Megaphone,
  PenTool,
} from "lucide-react";

/**
 * Category icon from the stable name stored in the database.
 *
 * The seed and the admin category editor store a lucide name, never an arbitrary SVG: an unknown
 * value falls back to a book instead of rendering attacker-controlled markup.
 */
const ICONS = {
  Code2,
  PenTool,
  Database,
  Briefcase,
  Calculator,
  Languages,
  Megaphone,
  GraduationCap,
} as const;

export function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = name !== null && name in ICONS ? ICONS[name as keyof typeof ICONS] : BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
