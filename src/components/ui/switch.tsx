"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Switch — 44×24 track, ink when on.
 *
 * The thumb is positioned with a logical `start` offset rather than a translate, so it slides toward
 * the end side in both Arabic (right→left) and English (left→right) without mirrored transforms —
 * the product requirements.
 */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border-strong",
        "bg-muted transition-colors duration-150 ease-brand",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none absolute start-0.5 top-0.5 block size-5 rounded-full bg-surface shadow-sm",
          "transition-[inset-inline-start] duration-150 ease-brand",
          "data-[state=checked]:start-[calc(100%-1.375rem)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
