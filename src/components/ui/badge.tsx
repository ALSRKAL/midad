import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Badge — status pills carry colour **and** text (colour is never the only signal, the product requirements).
 * Radius is 6px for count badges; the pill form is reserved for statuses.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border-strong bg-muted text-foreground",
        primary: "border-primary bg-primary text-primary-foreground",
        accent: "border-accent bg-accent text-accent-foreground",
        success: "border-success bg-success text-success-foreground",
        warning: "border-warning bg-warning text-warning-foreground",
        danger: "border-danger bg-danger text-danger-foreground",
        outline: "border-border-strong bg-transparent text-foreground",
      },
      shape: {
        rounded: "rounded-sm",
        pill: "rounded-full px-2.5",
      },
    },
    defaultVariants: { variant: "neutral", shape: "rounded" },
  },
);

export function Badge({
  className,
  variant,
  shape,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
