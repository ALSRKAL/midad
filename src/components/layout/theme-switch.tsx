"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, labelKey: "light" },
  { value: "dark", icon: Moon, labelKey: "dark" },
  { value: "system", icon: Monitor, labelKey: "system" },
] as const;

/** No-op store: only used to know whether we are on the client, without a setState-in-effect. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Theme switch — three explicit choices instead of a cycling button, because a cycle hides which
 * states exist and is awkward with a keyboard and a screen reader.
 *
 * The server cannot know the stored theme, so the selected state is only computed after hydration.
 * The visual theme itself never flashes: next-themes applies it before the first paint; only this
 * control's own pressed state settles afterwards.
 */
export function ThemeSwitch() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = mounted && theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={t(option.labelKey)}
            title={t(option.labelKey)}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm transition-colors duration-150 ease-brand",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
