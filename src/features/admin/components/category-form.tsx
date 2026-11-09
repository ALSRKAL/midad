"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCategoryAction, updateCategoryAction } from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";
import { slugify } from "@/lib/slug";
import type { AdminCategoryRow, CategoryInput } from "@/server/admin/categories";

/**
 * Category create/edit (P05-T04).
 *
 * The slug is derived from the English name while the admin types (until they edit it by hand), and
 * the server refuses invalid or duplicate slugs. The icon is a select over the allow-list.
 */

type Values = CategoryInput;

function messageFor(t: ReturnType<typeof useTranslations<"Admin">>, message: string): string {
  if (message.includes("SLUG_TAKEN")) return t("slugTaken");
  if (message.includes("SLUG_INVALID")) return t("slugInvalid");
  if (message.includes("NAME_REQUIRED")) return t("nameRequired");
  if (message.includes("ORDER_INVALID")) return t("orderInvalid");
  if (message.includes("CATEGORY_IN_USE")) return t("categoryInUse");
  return t("categoryActionFailed");
}

function CategoryFields({
  values,
  onChange,
  idPrefix,
  autoSlug,
}: {
  values: Values;
  onChange: (next: Values) => void;
  idPrefix: string;
  autoSlug: boolean;
}) {
  const t = useTranslations("Admin");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name-en`}>{t("categoryNameEn")}</Label>
        <Input
          id={`${idPrefix}-name-en`}
          dir="ltr"
          maxLength={120}
          value={values.nameEn}
          onChange={(event) => {
            const nameEn = event.target.value;
            onChange({
              ...values,
              nameEn,
              ...(autoSlug ? { slug: slugify(nameEn) } : {}),
            });
          }}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name-ar`}>{t("categoryNameAr")}</Label>
        <Input
          id={`${idPrefix}-name-ar`}
          dir="rtl"
          maxLength={120}
          value={values.nameAr}
          onChange={(event) => onChange({ ...values, nameAr: event.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-slug`}>{t("categorySlug")}</Label>
        <Input
          id={`${idPrefix}-slug`}
          dir="ltr"
          maxLength={60}
          value={values.slug}
          onChange={(event) => onChange({ ...values, slug: event.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-icon`}>{t("categoryIcon")}</Label>
        <Select
          id={`${idPrefix}-icon`}
          value={values.icon ?? ""}
          onChange={(event) =>
            onChange({ ...values, icon: event.target.value === "" ? null : event.target.value })
          }
        >
          <option value="">{t("iconNone")}</option>
          {CATEGORY_ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-order`}>{t("categoryOrder")}</Label>
        <Input
          id={`${idPrefix}-order`}
          type="number"
          min={0}
          max={999}
          value={String(values.sortOrder)}
          onChange={(event) => onChange({ ...values, sortOrder: Number(event.target.value) })}
        />
      </div>

      <div className="flex items-end gap-2 pb-2">
        <Switch
          id={`${idPrefix}-active`}
          aria-label={t("categoryActive")}
          checked={values.isActive}
          onCheckedChange={(checked) => onChange({ ...values, isActive: checked })}
        />
        <Label htmlFor={`${idPrefix}-active`}>{t("categoryActive")}</Label>
      </div>
    </div>
  );
}

const EMPTY: Values = {
  slug: "",
  nameAr: "",
  nameEn: "",
  icon: null,
  sortOrder: 0,
  isActive: true,
};

export function CategoryCreateForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createCategoryAction(values);
    setPending(false);

    if (!result.ok) {
      setError(messageFor(t, result.error.message));
      return;
    }
    setValues(EMPTY);
    router.refresh();
  }

  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("categoryCreate")}</h3>
      {error !== null && (
        <p
          role="alert"
          className="mt-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <form onSubmit={(event) => void submit(event)} className="mt-4">
        <CategoryFields values={values} onChange={setValues} idPrefix="new-category" autoSlug />
        <Button type="submit" className="mt-4" loading={pending}>
          {pending ? t("creatingCategory") : t("categoryCreate")}
        </Button>
      </form>
    </section>
  );
}

export function CategoryEditDialog({ category }: { category: AdminCategoryRow }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>({
    slug: category.slug,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    icon: category.icon,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateCategoryAction({ ...values, id: category.id });
    setPending(false);
    if (!result.ok) {
      setError(messageFor(t, result.error.message));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          {t("editCategory")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("cancel")} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editCategory")}</DialogTitle>
        </DialogHeader>
        {error !== null && (
          <p
            role="alert"
            className="mt-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <form onSubmit={(event) => void submit(event)} className="mt-4">
          <CategoryFields
            values={values}
            onChange={setValues}
            idPrefix={`edit-category-${category.id}`}
            autoSlug={false}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? t("savingCategory") : t("saveCategory")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
