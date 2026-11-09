"use client";

import { useTranslations } from "next-intl";

import type { SerializedError } from "@/lib/errors";

/**
 * Maps instructor-application failures to the active language.
 *
 * Field codes come from Zod; domain conflicts carry a stable message code from the service. Anything
 * unrecognised becomes the generic message, so no server prose reaches the interface.
 */
export function useApplicationError(): (error: SerializedError) => string {
  const t = useTranslations("Instructor");

  return (error) => {
    const fieldCode = error.fields === undefined ? undefined : Object.values(error.fields)[0]?.[0];
    switch (fieldCode) {
      case "EXPERIENCE_TOO_SHORT":
        return t("experienceTooShort");
      case "EXPERIENCE_TOO_LONG":
        return t("experienceTooLong");
      case "FIELD_REQUIRED":
        return t("fieldTooShort");
      case "FIELD_TOO_LONG":
        return t("fieldTooLong");
      case "URL_INVALID":
      case "URL_TOO_LONG":
        return t("urlInvalid");
      default:
        break;
    }

    if (error.message.includes("APPLICATION_PENDING")) return t("applicationPending");
    if (error.message.includes("APPLICATION_APPROVED")) return t("applicationApproved");
    if (error.kind === "RATE_LIMITED") return t("rateLimited");
    if (error.kind === "UNAUTHORIZED" || error.kind === "FORBIDDEN") return t("sessionExpired");
    return t("genericError");
  };
}
