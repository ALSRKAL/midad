import { useTranslations } from "next-intl";

/** Explains why an admin account sees an empty instructor area, without pretending it has data. */
export function NoInstructorProfile() {
  const t = useTranslations("InstructorDashboard");

  return (
    <div className="rounded-md border border-warning bg-surface p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        {t("adminNoProfileTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("adminNoProfileBody")}</p>
    </div>
  );
}
