import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Skeleton — must mirror the geometry of the content it replaces so the page does not shift when the
 * data arrives (the product requirements). Animation is opt-in via `motion-safe`, so reduced-motion users see a
 * static block.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("rounded-sm bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
