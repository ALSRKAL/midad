"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/**
 * Lottie player (the product requirements).
 *
 * - Loaded with a dynamic import and `ssr: false`, because the animation runtime is browser-only and
 *   must never be part of the server render or the initial bundle of a content page.
 * - The container reserves its final size, so the animation cannot shift the layout when it appears.
 * - With `prefers-reduced-motion` it is not played at all: the first frame stays as a static image.
 * - The canvas is decorative (`aria-hidden`); the message next to it carries the meaning, which is
 *   why every usage in this code base renders text beside the animation rather than inside it.
 *
 * Only the ten required moments use this component. It is never a loading skeleton.
 */

const LazyDotLottie = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((module) => module.DotLottieReact),
  { ssr: false },
);

export type LottiePlayerProps = {
  /** Path under /public/lottie, e.g. "/lottie/empty-search.json". */
  src: string;
  width: number;
  height: number;
  className?: string;
};

/** Reads the OS motion preference without pulling the Motion library into content pages. */
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void): () => void {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function getMotionSnapshot(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}
function getServerMotionSnapshot(): boolean {
  return false;
}

export function LottiePlayer({ src, width, height, className }: LottiePlayerProps) {
  const reduceMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getServerMotionSnapshot,
  );

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width, height, maxWidth: "100%" }}
      data-lottie={src}
    >
      {reduceMotion ? (
        // A still first frame is rendered by the player with autoplay disabled.
        <LazyDotLottie
          src={src}
          autoplay={false}
          loop={false}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <LazyDotLottie src={src} autoplay loop style={{ width: "100%", height: "100%" }} />
      )}
    </div>
  );
}
