import { Star } from "lucide-react";

import { intlLocales, type Locale } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Five-star rating display.
 *
 * The numeric value is the source of truth: the stars are decorative (aria-hidden) and a translated
 * label carries the same information for assistive tech. The filled row is clipped with a logical
 * `start` offset, so it fills from the correct edge in both Arabic and English.
 */
export function RatingStars({
  ratingAvg,
  ratingCount,
  locale,
  label,
  className,
  showCount = true,
}: {
  /** Average ×100 (0–500), as stored. */
  ratingAvg: number;
  ratingCount: number;
  locale: Locale;
  label: string;
  className?: string;
  /** A single review already shows its own number; the "(count)" suffix would be noise there. */
  showCount?: boolean;
}) {
  const clamped = Math.min(Math.max(ratingAvg, 0), 500);
  const percent = (clamped / 500) * 100;
  const value = (clamped / 100).toFixed(1);
  const count = new Intl.NumberFormat(intlLocales[locale]).format(ratingCount);
  const stars = [0, 1, 2, 3, 4];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden="true" className="relative inline-flex">
        <span className="flex gap-0.5 text-muted-foreground">
          {stars.map((star) => (
            <Star key={`outline-${star}`} className="size-3.5 shrink-0" />
          ))}
        </span>
        <span
          className="absolute inset-y-0 start-0 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <span className="flex min-w-max gap-0.5 text-accent-strong">
            {stars.map((star) => (
              <Star key={`fill-${star}`} className="size-3.5 shrink-0 fill-current" />
            ))}
          </span>
        </span>
      </span>
      <span className="tabular text-sm font-medium" dir="ltr">
        {value}
      </span>
      {showCount && (
        <span className="tabular text-sm text-muted-foreground" dir="ltr">
          {`(${count})`}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}
