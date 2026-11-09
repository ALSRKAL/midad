"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryEditDialog } from "@/features/admin/components/category-form";
import { deleteCategoryAction } from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";
import type { AdminCategoryRow } from "@/server/admin/categories";

/** Edit and delete controls for one category (P05-T04). */
export function CategoryActions({ category }: { category: AdminCategoryRow }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove(): Promise<boolean> {
    setDeleting(true);
    const result = await deleteCategoryAction({ id: category.id });
    setDeleting(false);
    if (!result.ok) return false;
    router.refresh();
    return true;
  }

  return (
    <div className="flex items-center gap-1">
      <CategoryEditDialog category={category} />
      {deleting ? (
        <span className="text-xs text-muted-foreground">{t("savingCategory")}</span>
      ) : (
        <ConfirmDialog
          triggerLabel={t("deleteCategoryConfirm")}
          title={t("categoryDeleteTitle")}
          description={t("categoryDeleteBody", { name: category.nameEn })}
          confirmLabel={t("categoryDeleteConfirm")}
          cancelLabel={t("cancel")}
          errorLabel={t("categoryInUse")}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
