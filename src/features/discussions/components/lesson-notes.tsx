"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNoteAction, deleteNoteAction } from "@/features/discussions/actions";
import { useRouter } from "@/i18n/navigation";
import { formatDurationLabel } from "@/lib/progress";

export type NoteRow = { id: string; body: string; timestampSec: number | null; createdAt: string };

/** Private timestamped notes (P07-T05). Clicking a timestamp seeks the player without reloading. */
export function LessonNotes({ lessonId, notes }: { lessonId: string; notes: NoteRow[] }) {
  const t = useTranslations("Discussions");
  const playerT = useTranslations("Player");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onTime = (event: Event) => setCurrentTime((event as CustomEvent<number>).detail);
    window.addEventListener("midad:time", onTime);
    return () => window.removeEventListener("midad:time", onTime);
  }, []);

  async function addNote() {
    if (body.trim().length < 2) return;
    setPending(true);
    setError(null);
    try {
      const result = await createNoteAction({
        lessonId,
        body,
        timestampSec: currentTime > 0 ? Math.floor(currentTime) : null,
      });
      if (!result.ok) {
        setError(t("noteError"));
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      // A dropped connection rejects the Server Action itself, not just its Result. Keep the
      // learner's text and explain the failure instead of leaving an unhandled rejection (P14-T05).
      setError(t("noteError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">{t("notePrivate")}</p>
      <div className="mt-3 space-y-2">
        <Label htmlFor="note-body">{playerT("notes")}</Label>
        <Textarea
          id="note-body"
          rows={3}
          value={body}
          maxLength={4000}
          placeholder={t("notePlaceholder")}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            loading={pending}
            disabled={body.trim().length < 2}
            onClick={() => {
              void addNote();
            }}
          >
            {currentTime > 0
              ? t("addAtTime", { time: formatDurationLabel(currentTime) })
              : t("addNote")}
          </Button>
        </div>
        {error !== null && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("notesEmpty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm whitespace-pre-line text-foreground">{note.body}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("deleteNote")}
                  onClick={() => {
                    void deleteNoteAction({ noteId: note.id }).then((result) => {
                      if (result.ok) router.refresh();
                      else setError(t("noteError"));
                    });
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              {note.timestampSec !== null && (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent<number>("midad:seek", { detail: note.timestampSec ?? 0 }),
                    )
                  }
                >
                  {playerT("resumeFrom", { time: formatDurationLabel(note.timestampSec) })}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
