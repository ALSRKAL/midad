import * as React from "react";

import { cn } from "@/lib/utils";

/** Textarea — same boundary, radius and focus behaviour as Input. */
export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-base text-foreground",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150 ease-brand",
        "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
        "field-sizing-content",
        className,
      )}
      {...props}
    />
  );
}
