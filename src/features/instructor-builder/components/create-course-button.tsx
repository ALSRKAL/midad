"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createCourseDraftAction } from "@/features/instructor-builder/actions";
import { useRouter } from "@/i18n/navigation";

/** Creates a draft on the server, then navigates to its editor. No client-supplied author id. */
export function CreateCourseButton() {
  const t = useTranslations("InstructorDashboard");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setPending(true);
    setError(null);
    const result = await createCourseDraftAction();
    setPending(false);

    if (!result.ok) {
      setError(t("createFailed"));
      return;
    }

    router.push(`/instructor/courses/${result.value.id}/edit`);
  }

  return (
    <div>
      <Button
        type="button"
        loading={pending}
        onClick={() => {
          void create();
        }}
      >
        {pending ? t("creating") : t("createCourse")}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
