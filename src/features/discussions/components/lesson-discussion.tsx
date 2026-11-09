"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptAnswerAction,
  createReplyAction,
  createThreadAction,
} from "@/features/discussions/actions";
import type { Locale } from "@/config/site";
import { useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";

export type ThreadRow = {
  id: string;
  title: string;
  body: string;
  isResolved: boolean;
  acceptedReplyId: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  replies: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    isInstructorAnswer: boolean;
    accepted: boolean;
  }>;
};

/** Course Q&A (P07-T05, BR-19): enrolled learners and the owning instructor can post. */
export function LessonDiscussion({
  courseId,
  lessonId,
  threads,
  currentUserId,
}: {
  courseId: string;
  lessonId: string;
  threads: ThreadRow[];
  currentUserId: string;
}) {
  const t = useTranslations("Discussions");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postThread(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createThreadAction({
      courseId,
      lessonId,
      title: readText(formData, "title"),
      body: readText(formData, "body"),
    });
    setPending(false);
    if (!result.ok) {
      setError(t("discussionError"));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("discussionTitle")}
        </h2>
        <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("newThread")}
        </Button>
      </div>

      {open && (
        <form
          className="mt-4 space-y-3 rounded-md border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void postThread(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="thread-title">{t("threadTitle")}</Label>
            <Input id="thread-title" name="title" required minLength={3} maxLength={160} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="thread-body">{t("threadBody")}</Label>
            <Textarea
              id="thread-body"
              name="body"
              rows={3}
              required
              minLength={10}
              maxLength={4000}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={pending}>
              {t("postThread")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {threads.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("threadEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {threads.map((thread) => (
            <li key={thread.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{thread.title}</h3>
                {thread.isResolved && <Badge variant="success">{t("accepted")}</Badge>}
              </div>
              <p className="mt-1 text-sm whitespace-pre-line text-foreground">{thread.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {`${t("by", { name: thread.authorName })} · ${formatDate(new Date(thread.createdAt), locale)}`}
              </p>

              {thread.replies.length > 0 && (
                <ul className="mt-3 space-y-2 border-s-2 border-border ps-3">
                  {thread.replies.map((reply) => (
                    <li key={reply.id} className="rounded-sm bg-muted p-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {reply.authorName}
                        </span>
                        {reply.isInstructorAnswer && (
                          <Badge variant="accent">{t("instructor")}</Badge>
                        )}
                        {reply.accepted && <Badge variant="success">{t("accepted")}</Badge>}
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-line text-foreground">
                        {reply.body}
                      </p>
                      {thread.authorId === currentUserId && !reply.accepted && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="mt-1"
                          onClick={() => {
                            void acceptAnswerAction({
                              threadId: thread.id,
                              replyId: reply.id,
                            }).then((result) => {
                              if (result.ok) router.refresh();
                              else setError(t("discussionError"));
                            });
                          }}
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          {t("accept")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="mt-3 flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const body = readText(formData, "reply");
                  if (body.trim() === "") return;
                  setPending(true);
                  void createReplyAction({ threadId: thread.id, body }).then((result) => {
                    setPending(false);
                    if (result.ok) router.refresh();
                    else setError(t("discussionError"));
                  });
                }}
              >
                <div className="flex-1">
                  <Label htmlFor={`reply-${thread.id}`} className="sr-only">
                    {t("reply")}
                  </Label>
                  <Input
                    id={`reply-${thread.id}`}
                    name="reply"
                    required
                    maxLength={4000}
                    placeholder={t("replyPlaceholder")}
                  />
                </div>
                <Button type="submit" variant="secondary" loading={pending}>
                  {t("reply")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
