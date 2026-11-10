import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — customised for the design system: 6px radius, 36px height, a visible control boundary
 * (`--border-strong`, 3:1) and a 44px touch target on coarse pointers (the product requirements).
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-foreground",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150 ease-brand",
        "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "pointer-coarse:h-11",
        className,
      )}
      {...props}
    />
  );
}
