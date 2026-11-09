"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  abortVideoUploadAction,
  completeVideoUploadAction,
  getVideoStatusAction,
  resumeVideoUploadAction,
  startVideoUploadAction,
} from "@/features/instructor-builder/video-actions";
import { formatDuration } from "@/lib/dates";
import type { VideoStatus, VideoUploadSession } from "@/server/video-upload";

/**
 * Direct-to-storage video upload (P04-T04).
 *
 * Parts go straight to the private bucket with presigned URLs and two parallel XHRs, so the browser
 * shows real byte progress and the app server never touches the video. Cancelling aborts the
 * multipart upload server-side. An interrupted upload is resumable: the server lists the parts S3
 * already has, and the instructor reselects the same file so the browser can send the rest.
 */

const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"] as const;
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

type Phase = "idle" | "starting" | "uploading" | "interrupted" | "processing" | "ready" | "failed";

export function VideoUploader({
  courseId,
  lessonId,
  initial,
}: {
  courseId: string;
  lessonId: string;
  initial: VideoStatus;
}) {
  const t = useTranslations("Video");
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>(
    initial.status === "READY"
      ? "ready"
      : initial.status === "PROCESSING"
        ? "processing"
        : initial.status === "UPLOADING"
          ? "interrupted"
          : initial.status === "FAILED"
            ? "failed"
            : "idle",
  );
  const [duration, setDuration] = useState(initial.durationSec);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resumeMode, setResumeMode] = useState(initial.canResume);

  const requests = useRef(new Map<number, XMLHttpRequest>());
  const loaded = useRef(new Map<number, number>());
  const cancelled = useRef(false);
  const totalBytes = useRef(0);

  useEffect(() => {
    if (phase !== "processing") return;
    let active = true;

    const tick = async () => {
      const result = await getVideoStatusAction({ courseId, lessonId });
      if (!active || !result.ok) return;
      if (result.value.status === "READY") {
        setPhase("ready");
        setDuration(result.value.durationSec);
      } else if (result.value.status === "FAILED") {
        setPhase("failed");
      }
    };

    const timer = setInterval(() => {
      void tick();
    }, 2500);
    void tick();

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [phase, courseId, lessonId]);

  useEffect(
    () => () => {
      for (const request of requests.current.values()) request.abort();
    },
    [],
  );

  function updateProgress() {
    const uploaded = [...loaded.current.values()].reduce((sum, value) => sum + value, 0);
    setPercent(
      totalBytes.current === 0
        ? 0
        : Math.min(100, Math.floor((uploaded / totalBytes.current) * 100)),
    );
  }

  function putPart(file: File, part: { partNumber: number; url: string }, partSize: number) {
    return new Promise<void>((resolve, reject) => {
      const start = (part.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const request = new XMLHttpRequest();
      request.open("PUT", part.url);
      request.setRequestHeader("Content-Type", "application/octet-stream");
      request.upload.addEventListener("progress", (event) => {
        loaded.current.set(part.partNumber, event.loaded);
        updateProgress();
      });
      request.addEventListener("load", () => {
        requests.current.delete(part.partNumber);
        if (request.status >= 200 && request.status < 300) {
          loaded.current.set(part.partNumber, blob.size);
          updateProgress();
          resolve();
        } else {
          reject(new Error(`PART_FAILED_${request.status}`));
        }
      });
      request.addEventListener("error", () => {
        requests.current.delete(part.partNumber);
        reject(new Error("PART_NETWORK"));
      });
      request.addEventListener("abort", () => {
        requests.current.delete(part.partNumber);
        reject(new Error("PART_ABORTED"));
      });

      requests.current.set(part.partNumber, request);
      request.send(blob);
    });
  }

  async function runUpload(file: File, session: VideoUploadSession) {
    cancelled.current = false;
    totalBytes.current = file.size;
    loaded.current = new Map();

    for (const partNumber of session.uploadedParts) {
      const start = (partNumber - 1) * session.partSize;
      loaded.current.set(partNumber, Math.min(session.partSize, file.size - start));
    }
    updateProgress();
    setPhase("uploading");
    setError(null);

    const queue = [...session.urls];
    const worker = async () => {
      for (;;) {
        if (cancelled.current) return;
        const part = queue.shift();
        if (part === undefined) return;
        await putPart(file, part, session.partSize);
      }
    };

    try {
      await Promise.all([worker(), worker()]);
    } catch {
      if (!cancelled.current) {
        setPhase("interrupted");
        setResumeMode(true);
        setError(t("uploadFailed"));
      }
      return;
    }

    if (cancelled.current) return;

    const completed = await completeVideoUploadAction({ courseId, lessonId });
    if (!completed.ok) {
      setPhase("interrupted");
      setResumeMode(true);
      setError(t("uploadFailed"));
      return;
    }

    setPercent(100);
    setPhase("processing");
  }

  async function startNew(file: File) {
    if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
      setError(t("invalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("tooLarge"));
      return;
    }

    setPhase("starting");
    setError(null);
    setResumeMode(false);
    const result = await startVideoUploadAction({
      courseId,
      lessonId,
      fileName: file.name,
      sizeBytes: file.size,
      contentType: file.type,
    });

    if (!result.ok) {
      setPhase("failed");
      setError(t("uploadFailed"));
      return;
    }

    await runUpload(file, result.value);
  }

  async function resume(file: File) {
    if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
      setError(t("invalidType"));
      return;
    }

    setPhase("starting");
    setError(null);
    const result = await resumeVideoUploadAction({ courseId, lessonId });
    if (!result.ok) {
      setPhase("failed");
      setResumeMode(false);
      setError(t("resumeFailed"));
      return;
    }

    setResumeMode(false);
    await runUpload(file, result.value);
  }

  async function cancel() {
    cancelled.current = true;
    for (const request of requests.current.values()) request.abort();
    requests.current.clear();
    const result = await abortVideoUploadAction({ courseId, lessonId });
    setPercent(0);
    setPhase("idle");
    setResumeMode(false);
    setError(result.ok ? null : t("cancelFailed"));
  }

  function onFilePicked(file: File | undefined) {
    if (file === undefined) return;
    if (resumeMode) {
      void resume(file);
    } else {
      void startNew(file);
    }
  }

  const canChooseFile = phase === "idle" || phase === "ready" || phase === "failed";
  const buttonLabel = phase === "ready" || phase === "failed" ? t("replaceFile") : t("chooseFile");

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label={buttonLabel}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          onFilePicked(file);
        }}
      />

      <p aria-live="polite" className="text-sm font-medium text-foreground">
        {phase === "idle" && t("statusNone")}
        {phase === "starting" && t("statusUploading", { percent })}
        {phase === "uploading" && t("statusUploading", { percent })}
        {phase === "interrupted" && t("statusFailedUpload")}
        {phase === "processing" && t("statusProcessing")}
        {phase === "ready" && t("statusReady")}
        {phase === "failed" && t("statusFailed")}
      </p>

      {(phase === "uploading" || phase === "starting") && (
        <div className="mt-2">
          <Progress value={percent} aria-label={t("statusUploading", { percent })} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="tabular text-sm text-muted-foreground" dir="ltr">
              {`${percent}%`}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void cancel()}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("durationReady", { duration: formatDuration(duration) })}
        </p>
      )}

      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {canChooseFile && (
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            {buttonLabel}
          </Button>
        )}

        {resumeMode && phase !== "uploading" && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              // Keep resumeMode true: the file picker result decides whether to resume or restart.
              inputRef.current?.click();
            }}
          >
            {t("resume")}
          </Button>
        )}
      </div>

      {resumeMode && <p className="mt-2 text-sm text-muted-foreground">{t("resumeHint")}</p>}
      {!resumeMode && <p className="mt-2 text-sm text-muted-foreground">{t("acceptedHint")}</p>}
    </div>
  );
}
