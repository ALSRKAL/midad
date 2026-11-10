"use client";

import type { ComponentProps } from "react";

import { Select } from "@/components/ui/select";

/**
 * A select that submits its form as soon as the value changes.
 *
 * Filters are plain GET forms, so they work without JavaScript; this only saves the extra "Apply"
 * click for controls where a change is unambiguous (admin tables and the catalog).
 */
export function AutoSubmitSelect({
  containerClassName,
  ...props
}: ComponentProps<"select"> & { containerClassName?: string }) {
  return (
    <Select
      {...props}
      {...(containerClassName === undefined ? {} : { containerClassName })}
      onChange={(event) => {
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
