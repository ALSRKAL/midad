"use client";

import { useTranslations } from "next-intl";

import type { SerializedError } from "@/lib/errors";

/**
 * Translates a server action failure into the account settings vocabulary.
 *
 * The action layer returns codes (NAME_TOO_LONG, AVATAR_TOO_LARGE, …), never prose, so this is the
 * single place that maps them to the active language. An unknown code becomes the generic message;
 * an error string never reaches the interface.
 */
export function useAccountError(): (error: SerializedError | undefined) => string {
  const t = useTranslations("Account");

  return (error) => {
    if (error === undefined) return t("genericError");

    const code = error.fields === undefined ? undefined : Object.values(error.fields)[0]?.[0];
    switch (code) {
      case "AVATAR_EMPTY":
        return t("avatarEmpty");
      case "AVATAR_TOO_LARGE":
        return t("avatarTooLarge");
      case "AVATAR_UNSUPPORTED":
        return t("avatarUnsupported");
      case "NAME_TOO_SHORT":
        return t("nameTooShort");
      case "NAME_TOO_LONG":
        return t("nameTooLong");
      case "BIO_TOO_LONG":
        return t("bioTooLong");
      case "EMAIL_MISMATCH":
        return t("deleteMismatch");
      default:
        break;
    }

    if (error.kind === "RATE_LIMITED") return t("rateLimited");
    if (error.kind === "UNAUTHORIZED" || error.kind === "FORBIDDEN") return t("sessionExpired");
    return t("genericError");
  };
}
