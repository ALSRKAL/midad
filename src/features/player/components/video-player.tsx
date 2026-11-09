"use client";

import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import type { MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { saveProgressAction } from "@/features/player/actions";
import { useRouter } from "@/i18n/navigation";
import { formatDurationLabel } from "@/lib/progress";

/**
 * HLS lesson player (P07-T03).
 *
 * The player itself stays LTR (time always runs left to right), while its labels follow the locale.
 * Playback is tracked as the union of watched intervals, so seeking to the end cannot complete a
 * lesson. Position is flushed every ten seconds, on pause, and with a beacon on page hide.
 */

const ARABIC_LAYOUT = {
  Accessibility: "إمكانية الوصول",
  AirPlay: "AirPlay",
  Audio: "الصوت",
  Auto: "تلقائي",
  Boost: "تعزيز",
  Captions: "الترجمة النصية",
  "Caption Styles": "أنماط الترجمة",
  "Captions look like this": "هكذا تظهر الترجمة",
  Chapters: "الفصول",
  "Closed-Captions Off": "إيقاف الترجمة",
  "Closed-Captions On": "تشغيل الترجمة",
  Connected: "متصل",
  Continue: "متابعة",
  Connecting: "جارٍ الاتصال",
  Default: "افتراضي",
  Disabled: "معطّل",
  Disconnected: "غير متصل",
  "Display Background": "خلفية العرض",
  Download: "تنزيل",
  "Enter Fullscreen": "ملء الشاشة",
  "Enter PiP": "صورة داخل صورة",
  "Exit Fullscreen": "إنهاء ملء الشاشة",
  "Exit PiP": "إنهاء صورة داخل صورة",
  Font: "الخط",
  Family: "العائلة",
  Fullscreen: "ملء الشاشة",
  "Google Cast": "Google Cast",
  "Keyboard Animations": "حركات لوحة المفاتيح",
  LIVE: "مباشر",
  Loop: "تكرار",
  Mute: "كتم",
  Normal: "عادي",
  Off: "إيقاف",
  Pause: "إيقاف مؤقت",
  Play: "تشغيل",
  Playback: "التشغيل",
  PiP: "صورة داخل صورة",
  Quality: "الجودة",
  Replay: "إعادة",
  Reset: "إعادة ضبط",
  "Seek Backward": "رجوع",
  "Seek Forward": "تقدّم",
  Seek: "انتقال",
  Settings: "الإعدادات",
  "Skip To Live": "الانتقال إلى المباشر",
  Speed: "السرعة",
  Size: "الحجم",
  Color: "اللون",
  Opacity: "الشفافية",
  Shadow: "الظل",
  Text: "النص",
  "Text Background": "خلفية النص",
  Track: "المسار",
  Unmute: "إلغاء الكتم",
  Volume: "الصوت",
  Announcements: "الإعلانات",
} as const;

export function VideoPlayer({
  lessonId,
  srcUrl,
  srcType,
  posterUrl,
  captionsUrl,
  initialPosition,
  locale,
}: {
  lessonId: string;
  srcUrl: string;
  srcType: "application/x-mpegurl" | "video/mp4";
  posterUrl: string | null;
  captionsUrl: string | null;
  initialPosition: number;
  locale: "ar" | "en";
}) {
  const t = useTranslations("Player");
  const router = useRouter();
  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const lastTime = useRef(initialPosition);
  const segmentStart = useRef(initialPosition);
  const savedAt = useRef(initialPosition);
  const playing = useRef(false);
  const saving = useRef(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function flush(endSec: number): Promise<void> {
    const start = segmentStart.current;
    if (saving.current || endSec <= start + 0.5) return;
    saving.current = true;
    setStatus("saving");
    const result = await saveProgressAction({
      lessonId,
      startSec: start,
      endSec,
      positionSec: endSec,
    });
    saving.current = false;
    segmentStart.current = endSec;
    savedAt.current = endSec;
    if (!result.ok) {
      setStatus("error");
      return;
    }
    setStatus("saved");
    if (result.value.lessonCompleted) router.refresh();
  }

  useEffect(() => {
    const onSeekRequest = (event: Event) => {
      const seconds = (event as CustomEvent<number>).detail;
      if (playerRef.current !== null && Number.isFinite(seconds)) {
        playerRef.current.currentTime = seconds;
      }
    };
    window.addEventListener("midad:seek", onSeekRequest);
    return () => window.removeEventListener("midad:seek", onSeekRequest);
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      const current = playerRef.current?.currentTime ?? lastTime.current;
      if (current <= segmentStart.current + 0.5) return;
      navigator.sendBeacon(
        "/api/player/progress",
        new Blob(
          [
            JSON.stringify({
              lessonId,
              startSec: segmentStart.current,
              endSec: current,
              positionSec: current,
            }),
          ],
          { type: "application/json" },
        ),
      );
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush(lastTime.current);
    };
    // flush is stable enough for the lifetime of this player instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  return (
    <div dir="ltr" className="midad-player overflow-hidden rounded-md bg-[var(--media-bg)]">
      <MediaPlayer
        ref={playerRef}
        src={{ src: srcUrl, type: srcType }}
        title={t("title")}
        playsInline
        // Apply the resume position as soon as metadata is seekable, then again once enough data
        // exists. WebKit can drop a seek issued only on canplay when the source finishes attaching
        // (P15-T01); the second call is a no-op when the position already took.
        onLoadedMetadata={() => {
          // Resume any saved position beyond the first second; a five-second threshold skipped
          // learners who paused just after five seconds (P15-T01).
          if (playerRef.current !== null && initialPosition > 1) {
            playerRef.current.currentTime = initialPosition;
          }
        }}
        onCanPlay={() => {
          if (
            playerRef.current !== null &&
            initialPosition > 1 &&
            playerRef.current.currentTime < 1
          ) {
            playerRef.current.currentTime = initialPosition;
          }
        }}
        onPlay={() => {
          playing.current = true;
          const current = playerRef.current?.currentTime ?? lastTime.current;
          segmentStart.current = current;
          lastTime.current = current;
        }}
        onPause={() => {
          playing.current = false;
          const current = playerRef.current?.currentTime ?? lastTime.current;
          void flush(current);
        }}
        onEnded={() => {
          playing.current = false;
          const current = playerRef.current?.currentTime ?? lastTime.current;
          void flush(current);
        }}
        onTimeUpdate={(detail) => {
          const current = detail.currentTime;
          if (!playing.current) return;
          const delta = current - lastTime.current;
          if (delta < 0 || delta > 2) {
            // A seek: do not count the jumped-over content, and start a fresh interval here.
            const jumped = Math.abs(delta) > 2;
            lastTime.current = current;
            if (jumped) {
              segmentStart.current = current;
              savedAt.current = current;
            }
            return;
          }
          lastTime.current = current;
          window.dispatchEvent(new CustomEvent<number>("midad:time", { detail: current }));
          if (Math.abs(current - savedAt.current) >= 10) {
            void flush(current);
          }
        }}
      >
        <MediaProvider>
          {captionsUrl !== null && (
            <track kind="captions" src={captionsUrl} srcLang="ar" label={t("captions")} default />
          )}
          {posterUrl !== null && <Poster src={posterUrl} alt={t("title")} />}
        </MediaProvider>
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          translations={locale === "ar" ? ARABIC_LAYOUT : null}
        />
      </MediaPlayer>
      <p
        role="status"
        className="px-3 py-2 text-xs text-muted-foreground"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {status === "saving"
          ? t("saving")
          : status === "saved"
            ? t("saved")
            : status === "error"
              ? t("saveError")
              : initialPosition > 0
                ? t("resumeFrom", { time: formatDurationLabel(initialPosition) })
                : ""}
      </p>
    </div>
  );
}
