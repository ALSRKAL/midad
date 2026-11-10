import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button — customised shadcn/ui primitive (Radix Slot) for the Midad design system.
 * See docs/DESIGN_SYSTEM.md §7: 10px radius, weight 500, 150ms states, 32/36/44px heights,
 * pending state that blocks double submission, and a visible focus ring.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md",
    "font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-brand",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        secondary:
          "border border-border-strong bg-surface text-foreground hover:bg-muted active:bg-secondary",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-muted active:bg-secondary",
        ghost: "bg-transparent text-foreground hover:bg-muted active:bg-secondary",
        accent: "bg-accent text-accent-foreground hover:bg-accent-strong hover:text-background",
        danger:
          "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15 active:bg-danger/20",
        link: "h-auto bg-transparent p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, sets aria-busy and blocks further clicks. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type="button"
      data-slot="button"
      className={classes}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
