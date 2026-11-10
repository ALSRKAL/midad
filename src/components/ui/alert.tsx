import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Alert — an inline, persistent message (not a toast). `role="alert"` for errors, `role="status"`
 * for informational variants, so screen readers announce it once without stealing focus.
 *
 * Status variants keep the surface background and carry the colour in the border and the text: a
 * 10% status tint under coloured text measured 3.9–4.4:1 and failed AA in the axe pass (P01-T05).
 */
const alertVariants = cva("relative flex gap-3 rounded-md border bg-surface p-4 text-sm", {
  variants: {
    variant: {
      info: "border-border-strong text-foreground",
      success: "border-success text-success",
      warning: "border-warning text-warning",
      danger: "border-danger text-danger",
    },
  },
  defaultVariants: { variant: "info" },
});

export function Alert({
  className,
  variant = "info",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={variant === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="alert-title" className={cn("font-medium", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { alertVariants };
