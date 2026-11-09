"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createCouponAction } from "@/features/coupons/actions";
import { useRouter } from "@/i18n/navigation";
import { parseMoneyInput } from "@/lib/money";

export type CouponCourseOption = { id: string; titleAr: string | null; titleEn: string | null };

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Create a coupon (P06-T02). Instructors must pick one of their own courses; admins may leave the
 * scope empty for a platform-wide coupon. The server repeats every rule that matters.
 */
export function CouponForm({
  role,
  courses,
  locale,
}: {
  role: "ADMIN" | "INSTRUCTOR";
  courses: CouponCourseOption[];
  locale: "ar" | "en";
}) {
  const t = useTranslations("Coupons");
  const router = useRouter();
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function errorMessage(fields: Record<string, string[]> | undefined, message: string): string {
    const codes = Object.values(fields ?? {}).flat();
    const code = [...codes, message].find((value) => t.has(`errors.${value}`));
    return code === undefined ? t("errors.default") : t(`errors.${code}`);
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(false);

    const code = textField(formData, "code");
    const courseId = textField(formData, "courseId");
    const percentageRaw = textField(formData, "percentage");
    const amountRaw = textField(formData, "amount");
    const maxRaw = textField(formData, "maxRedemptions");
    let minCartCents = 0;
    try {
      minCartCents = parseMoneyInput(textField(formData, "minCart") || "0", "SAR");
    } catch {
      setError(t("errors.COUPON_AMOUNT_REQUIRED"));
      setPending(false);
      return;
    }

    const result = await createCouponAction({
      code,
      type,
      percentage: type === "PERCENTAGE" && percentageRaw !== "" ? Number(percentageRaw) : null,
      amountOffCents:
        type === "FIXED" && amountRaw !== "" ? parseMoneyInput(amountRaw, "SAR") : null,
      courseId: courseId === "" ? null : courseId,
      startsAt: new Date(textField(formData, "startsAt")).toISOString(),
      endsAt: new Date(textField(formData, "endsAt")).toISOString(),
      maxRedemptions: maxRaw === "" ? null : Number(maxRaw),
      maxPerUser: Number(textField(formData, "maxPerUser") || "1"),
      minCartCents,
    });
    setPending(false);

    if (!result.ok) {
      setError(errorMessage(result.error.fields, result.error.message));
      return;
    }
    setSuccess(true);
    router.refresh();
    const form = document.getElementById("coupon-form") as HTMLFormElement | null;
    form?.reset();
    setType("PERCENTAGE");
  }

  return (
    <section
      aria-labelledby="coupon-create-title"
      className="rounded-md border border-border bg-surface p-5"
    >
      <h2 id="coupon-create-title" className="font-heading text-lg font-semibold text-foreground">
        {t("createTitle")}
      </h2>

      <form
        id="coupon-form"
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="coupon-new-code">{t("code")}</Label>
          <Input id="coupon-new-code" name="code" dir="ltr" required maxLength={40} />
          <p className="text-xs text-muted-foreground">{t("codeHint")}</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-new-type">{t("type")}</Label>
          <Select
            id="coupon-new-type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value === "FIXED" ? "FIXED" : "PERCENTAGE")}
          >
            <option value="PERCENTAGE">{t("typePercentage")}</option>
            <option value="FIXED">{t("typeFixed")}</option>
          </Select>
        </div>

        {type === "PERCENTAGE" ? (
          <div className="space-y-1">
            <Label htmlFor="coupon-new-percentage">{t("percentage")}</Label>
            <Input
              id="coupon-new-percentage"
              name="percentage"
              type="number"
              min={1}
              max={100}
              step={1}
              required
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="coupon-new-amount">{t("fixedAmount")}</Label>
            <Input
              id="coupon-new-amount"
              name="amount"
              inputMode="decimal"
              dir="ltr"
              required
              placeholder="50.00"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="coupon-new-course">{t("course")}</Label>
          <Select id="coupon-new-course" name="courseId" required={role !== "ADMIN"}>
            {role === "ADMIN" && <option value="">{t("platformWide")}</option>}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {(locale === "en" ? course.titleEn : course.titleAr) ??
                  course.titleAr ??
                  course.titleEn ??
                  course.id}
              </option>
            ))}
          </Select>
        </div>

        <div
          data-focus-ring
          className="space-y-1 rounded-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring focus-within:outline-solid"
        >
          <Label htmlFor="coupon-new-starts">{t("startsAt")}</Label>
          <Input id="coupon-new-starts" name="startsAt" type="datetime-local" required />
        </div>
        <div
          data-focus-ring
          className="space-y-1 rounded-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring focus-within:outline-solid"
        >
          <Label htmlFor="coupon-new-ends">{t("endsAt")}</Label>
          <Input id="coupon-new-ends" name="endsAt" type="datetime-local" required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-new-max">{t("maxRedemptions")}</Label>
          <Input id="coupon-new-max" name="maxRedemptions" type="number" min={1} step={1} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="coupon-new-per-user">{t("maxPerUser")}</Label>
          <Input
            id="coupon-new-per-user"
            name="maxPerUser"
            type="number"
            min={1}
            max={100}
            step={1}
            defaultValue={1}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="coupon-new-min">{t("minCart")}</Label>
          <Input
            id="coupon-new-min"
            name="minCart"
            inputMode="decimal"
            dir="ltr"
            defaultValue="0"
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" loading={pending}>
            {pending ? t("creating") : t("create")}
          </Button>
        </div>
      </form>

      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-sm text-success">
          {t("created")}
        </p>
      )}
    </section>
  );
}
