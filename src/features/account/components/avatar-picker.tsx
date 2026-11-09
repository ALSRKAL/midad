"use client";

import NextImage from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateAvatarAction } from "@/features/account/actions";
import { useAccountError } from "@/features/account/components/use-account-error";
import { useRouter } from "@/i18n/navigation";
import {
  AVATAR_OUTPUT_SIZE,
  computeCropRect,
  MAX_AVATAR_ZOOM,
  MIN_AVATAR_ZOOM,
} from "@/lib/image-crop";

/**
 * Avatar upload with crop (the product requirements).
 *
 * The file never leaves the browser unprocessed: the crop dialog draws the selected square onto a
 * 512×512 canvas, and only that square is uploaded. The preview canvas and the exported canvas use
 * the same `computeCropRect`, so what the learner sees is exactly what is stored.
 *
 * Zoom and position are range inputs rather than drag-only, which keeps the whole interaction
 * keyboard-operable (the browser protocol requires a keyboard pass).
 */

const PREVIEW_SIZE = 288;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 2 * 1024 * 1024;

type Draft = {
  file: File;
  url: string;
  width: number;
  height: number;
  element: HTMLImageElement;
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  const element = new Image();
  await new Promise<void>((resolve, reject) => {
    element.onload = () => resolve();
    element.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    element.src = url;
  });
  return element;
}

export function AvatarPicker({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const t = useTranslations("Account");
  const errorMessage = useAccountError();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const [image, setImage] = useState(imageUrl);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke the object URL when the draft is replaced or the component unmounts.
  useEffect(() => {
    if (draft === null) return;
    return () => {
      URL.revokeObjectURL(draft.url);
    };
  }, [draft]);

  // Redraw the preview whenever the geometry changes. No state is set here, so it is safe in an
  // effect and cheap enough to run on every slider tick.
  useEffect(() => {
    const canvas = previewRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || draft === null) return;

    const crop = computeCropRect({
      imageWidth: draft.width,
      imageHeight: draft.height,
      zoom,
      panX,
      panY,
    });
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      draft.element,
      crop.sx,
      crop.sy,
      crop.size,
      crop.size,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [draft, zoom, panX, panY]);

  function closeCrop() {
    setOpen(false);
    setDraft(null);
    setPending(false);
    setError(null);
  }

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      setError(t("avatarUnsupported"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("avatarTooLarge"));
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const element = await loadImage(url);
      setDraft({ file, url, width: element.naturalWidth, height: element.naturalHeight, element });
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setOpen(true);
    } catch {
      setError(t("avatarUnsupported"));
    }
  }

  async function handleSave() {
    if (draft === null) return;
    setPending(true);
    setError(null);

    try {
      const crop = computeCropRect({
        imageWidth: draft.width,
        imageHeight: draft.height,
        zoom,
        panX,
        panY,
      });
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("CANVAS_UNAVAILABLE");
      context.imageSmoothingQuality = "high";
      context.drawImage(
        draft.element,
        crop.sx,
        crop.sy,
        crop.size,
        crop.size,
        0,
        0,
        AVATAR_OUTPUT_SIZE,
        AVATAR_OUTPUT_SIZE,
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.9);
      });
      if (blob === null) throw new Error("CANVAS_ENCODE_FAILED");

      const formData = new FormData();
      // The server re-reads the bytes and checks the magic signature; the name is only a hint.
      formData.append("avatar", new File([blob], "avatar.webp", { type: blob.type }));

      const result = await updateAvatarAction(formData);
      if (!result.ok) {
        setError(errorMessage(result.error));
        setPending(false);
        return;
      }

      setImage(result.value.image);
      closeCrop();
      router.refresh();
    } catch {
      setError(errorMessage(undefined));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {image === null ? (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center font-heading text-2xl text-muted-foreground"
          >
            {name.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <NextImage
            src={image}
            alt={t("avatarAlt", { name })}
            width={80}
            height={80}
            unoptimized
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="space-y-1">
        <input
          ref={inputRef}
          id="avatar"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label={t("changeAvatar")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file !== undefined) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          aria-describedby="avatar-hint"
        >
          {t("changeAvatar")}
        </Button>
        <p id="avatar-hint" className="text-sm text-muted-foreground">
          {t("avatarHint")}
        </p>
        {error !== null && open === false && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeCrop();
        }}
      >
        <DialogContent closeLabel={t("close")} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cropTitle")}</DialogTitle>
            <DialogDescription>{t("cropDescription")}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex justify-center">
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE * 2}
              height={PREVIEW_SIZE * 2}
              role="img"
              aria-label={t("cropPreview")}
              className="size-72 rounded-md border border-border bg-muted"
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="crop-zoom">{t("zoom")}</Label>
              <input
                id="crop-zoom"
                type="range"
                min={MIN_AVATAR_ZOOM}
                max={MAX_AVATAR_ZOOM}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crop-pan-x">{t("positionX")}</Label>
              <input
                id="crop-pan-x"
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={panX}
                onChange={(event) => setPanX(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crop-pan-y">{t("positionY")}</Label>
              <input
                id="crop-pan-y"
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={panY}
                onChange={(event) => setPanY(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {error !== null && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeCrop} disabled={pending}>
              {t("cropCancel")}
            </Button>
            <Button
              type="button"
              loading={pending}
              onClick={() => {
                void handleSave();
              }}
            >
              {pending ? t("saving") : t("cropConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
