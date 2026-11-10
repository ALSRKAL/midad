"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Progress — saffron fill on a bordered track. The numeric value is rendered next to it by the
 * caller, because colour must never be the only carrier of meaning (the product requirements).
 */
export function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={clamped}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-accent-strong transition-[width] duration-250 ease-brand"
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
