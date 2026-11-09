"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";

/**
 * Success-page polling (BR-08). The page never creates an enrolment; it only refreshes until the
 * webhook transaction has committed. Polling stops after two minutes and says so, instead of
 * spinning forever.
 */
export function CheckoutPoller() {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const [stopped, setStopped] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      attempts.current += 1;
      if (attempts.current >= 48) {
        window.clearInterval(timer);
        setStopped(true);
        return;
      }
      router.refresh();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <p
      role="status"
      aria-live="polite"
      className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
    >
      {!stopped && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {stopped ? t("pollingStopped") : t("polling")}
    </p>
  );
}
