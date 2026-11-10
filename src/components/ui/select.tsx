import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Select — the native control, styled to match Input.
 *
 * A native `<select>` is deliberate: it is keyboard- and screen-reader-correct everywhere, works
 * with RTL out of the box, and the mobile picker is the platform's own. Only the visual shell is
 * ours (boundary, radius, focus ring, 44px touch height), plus a chevron positioned with a logical
 * `end` offset so it sits on the correct side in both languages.
 */
export function Select({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"select"> & { containerClassName?: string }) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full appearance-none rounded-sm border border-border-strong bg-surface px-3 py-2 pe-10 text-base text-foreground",
          "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-danger",
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
