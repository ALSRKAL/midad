"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * "Export my data" (the product requirements).
 *
 * Calls the authenticated route handler and saves the response as a file. The download is done with
 * an object URL so no navigation away from the settings page happens.
 */
export function ExportDataButton() {
  const t = useTranslations("Account");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/account/export", {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        setError(t("exportFailed"));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `midad-account-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("exportFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        onClick={() => {
          void handleExport();
        }}
      >
        {pending ? t("exporting") : t("exportData")}
      </Button>
      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
