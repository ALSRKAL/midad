"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction } from "@/features/announcements/actions";
import { useRouter } from "@/i18n/navigation";

export type AnnouncementCourse = { id: string; titleAr: string | null; titleEn: string | null };

/** Announcement composer (P09-T04); recipients are resolved from active enrolments in the server. */
export function AnnouncementForm({
  courses,
  locale,
}: {
  courses: AnnouncementCourse[];
  locale: "ar" | "en";
}) {
  const t = useTranslations("Announcements");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setStatus(null);
    const result = await createAnnouncementAction({
      courseId: read(formData, "courseId"),
      title: read(formData, "title"),
      body: read(formData, "body"),
    });
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    setStatus(t("posted"));
    router.refresh();
    const form = document.getElementById("announcement-form") as HTMLFormElement | null;
    form?.reset();
  }

  return (
    <section className="rounded-md border border-border bg-surface p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">{t("new")}</h2>
      <form
        id="announcement-form"
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="announcement-course">{t("course")}</Label>
          <Select id="announcement-course" name="courseId" required>
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
        <div className="space-y-1">
          <Label htmlFor="announcement-title">{t("titleLabel")}</Label>
          <Input id="announcement-title" name="title" required minLength={3} maxLength={160} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="announcement-body">{t("bodyLabel")}</Label>
          <Textarea
            id="announcement-body"
            name="body"
            rows={5}
            required
            minLength={10}
            maxLength={5000}
          />
        </div>
        <Button type="submit" loading={pending}>
          {pending ? t("posting") : t("post")}
        </Button>
        {status !== null && (
          <p role="status" className="text-sm text-success">
            {status}
          </p>
        )}
        {error !== null && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function read(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
