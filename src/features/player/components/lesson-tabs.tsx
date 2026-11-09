"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TabKey = "overview" | "notes" | "questions" | "attachments";

/** Lesson tabs (P07-T05). Panels are server-rendered; only the active one is visible. */
export function LessonTabs({
  overview,
  notes,
  questions,
  attachments,
  showCommunity = true,
  initialTab = "overview",
}: {
  overview: ReactNode;
  notes: ReactNode;
  questions: ReactNode;
  attachments: ReactNode;
  showCommunity?: boolean;
  initialTab?: TabKey;
}) {
  const t = useTranslations("Player");
  const [active, setActive] = useState<TabKey>(initialTab);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: t("overview") },
    ...(showCommunity
      ? [
          { key: "notes" as const, label: t("notes") },
          { key: "questions" as const, label: t("questions") },
        ]
      : []),
    { key: "attachments", label: t("attachments") },
  ];
  const panels: Partial<Record<TabKey, ReactNode>> = {
    overview,
    notes: showCommunity ? notes : null,
    questions: showCommunity ? questions : null,
    attachments,
  };

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const rtl = document.documentElement.dir === "rtl";
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
    const direction = event.key === nextKey ? 1 : -1;
    const next = (index + direction + tabs.length) % tabs.length;
    const tab = tabs[next];
    if (tab !== undefined) {
      setActive(tab.key);
      document.getElementById(`lesson-tab-${tab.key}`)?.focus();
    }
  }

  return (
    <section className="mt-8">
      <div
        role="tablist"
        aria-label={t("overview")}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`lesson-tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`lesson-panel-${tab.key}`}
            tabIndex={active === tab.key ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-t-sm px-4 py-2 text-sm font-medium",
              active === tab.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`lesson-panel-${tab.key}`}
          aria-labelledby={`lesson-tab-${tab.key}`}
          hidden={active !== tab.key}
          className="pt-4"
        >
          {panels[tab.key]}
        </div>
      ))}
    </section>
  );
}
