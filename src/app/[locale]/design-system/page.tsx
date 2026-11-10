import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertCircle, Check, Info, Plus, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Living catalogue of the design system (P01-T05).
 *
 * Development only: it 404s in a production build unless `ENABLE_DESIGN_SYSTEM=1` is set at build
 * time, which exists solely so the screenshot and axe audits can run against a production build
 * (where the dev HMR socket does not exist). Deployments never set it — see `.env.example`.
 */

const COLOR_TOKENS = [
  { name: "background", className: "bg-background text-foreground", onColor: false },
  { name: "surface", className: "bg-surface text-surface-foreground", onColor: false },
  { name: "muted", className: "bg-muted text-muted-foreground", onColor: false },
  { name: "primary", className: "bg-primary text-primary-foreground", onColor: true },
  { name: "accent", className: "bg-accent text-accent-foreground", onColor: true },
  { name: "accent-strong", className: "bg-accent-strong text-background", onColor: true },
  { name: "success", className: "bg-success text-success-foreground", onColor: true },
  { name: "warning", className: "bg-warning text-warning-foreground", onColor: true },
  { name: "danger", className: "bg-danger text-danger-foreground", onColor: true },
] as const;

const TYPE_SCALE = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
] as const;

const SPACE_STEPS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20] as const;

/** Internal tool: keep it out of every index even on a development deploy. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DESIGN_SYSTEM !== "1") notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "DesignSystem" });
  const label = (key: string) => t(`labels.${key}`);

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 pb-24">
      <header className="max-w-2xl py-8">
        <h1 className="font-heading text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* ---------------------------------------------------------------- Colours */}
      <section aria-labelledby="ds-colors" className="mt-8">
        <h2 id="ds-colors" className="font-heading text-2xl">
          {t("sections.colors")}
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_TOKENS.map((token) => (
            <li
              key={token.name}
              className={`rounded-md border border-border px-4 py-6 ${token.className}`}
            >
              <p className="font-mono text-xs">{`--${token.name}`}</p>
              <p className="mt-1 text-sm">{token.onColor ? `on ${token.name}` : token.name}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-sm border border-border-strong px-3 py-1 font-mono text-xs">
            {`border-strong · 3:1`}
          </span>
          <span className="rounded-sm border border-border px-3 py-1 font-mono text-xs">
            {`border · decorative`}
          </span>
        </div>
      </section>

      {/* -------------------------------------------------------------- Typography */}
      <section aria-labelledby="ds-type" className="mt-16">
        <h2 id="ds-type" className="font-heading text-2xl">
          {t("sections.typography")}
        </h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="font-heading text-3xl">{label("primary")}</p>
            <p className="text-muted-foreground">
              {`Readex Pro · 400/500/600 · `}
              <span className="font-mono text-xs">{`--font-heading`}</span>
            </p>
            <p className="text-lg">{label("emailHint")}</p>
            <p className="text-muted-foreground">
              {`IBM Plex Sans Arabic / Sans · 16px · 1.7 Arabic · 1.55 Latin`}
            </p>
            <p className="font-mono text-sm">{`npm run build --filter web`}</p>
            <p className="text-muted-foreground">{`IBM Plex Mono · 400/500`}</p>
          </div>

          <ul className="space-y-1">
            {TYPE_SCALE.map((step) => (
              <li
                key={step}
                className="flex items-baseline justify-between gap-4 border-b border-border py-1"
              >
                <span className={`${step} font-heading`}>{label("primary")}</span>
                <span className="font-mono text-xs text-muted-foreground">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------- Spacing, radii, elevation */}
      <section aria-labelledby="ds-space" className="mt-16">
        <h2 id="ds-space" className="font-heading text-2xl">
          {t("sections.spacing")}
        </h2>

        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">{`4px grid`}</p>
            <ul className="mt-3 space-y-2">
              {SPACE_STEPS.map((step) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="w-10 font-mono text-xs text-muted-foreground">{step}</span>
                  <span
                    className="h-3 rounded-xs bg-primary"
                    style={{ width: `${step * 4}px` }}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xs border border-border-strong px-4 py-2 text-sm">
                {`rounded-xs 4`}
              </span>
              <span className="rounded-sm border border-border-strong px-4 py-2 text-sm">
                {`rounded-sm 6`}
              </span>
              <span className="rounded-md border border-border-strong px-4 py-2 text-sm">
                {`rounded-md 10`}
              </span>
              <span className="rounded-lg border border-border-strong px-4 py-2 text-sm">
                {`rounded-lg 14`}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-surface px-4 py-2 text-sm shadow-sm">{`shadow-sm`}</span>
              <span className="rounded-sm bg-surface px-4 py-2 text-sm shadow-md">{`shadow-md`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- Motion */}
      <section aria-labelledby="ds-motion" className="mt-16">
        <h2 id="ds-motion" className="font-heading text-2xl">
          {t("sections.motion")}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-sm border border-border-strong px-3 py-1 font-mono text-xs">
            {`150ms states · 250ms overlays`}
          </span>
          <span className="rounded-sm border border-border px-3 py-1 font-mono text-xs">
            {`cubic-bezier(0.2, 0, 0, 1)`}
          </span>
          <span className="rounded-sm border border-border px-3 py-1 font-mono text-xs">
            {`prefers-reduced-motion: all off`}
          </span>
        </div>
      </section>

      {/* ----------------------------------------------------------------- Buttons */}
      <section aria-labelledby="ds-buttons" className="mt-16">
        <h2 id="ds-buttons" className="font-heading text-2xl">
          {t("sections.buttons")}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>{label("primary")}</Button>
          <Button variant="secondary">{label("secondary")}</Button>
          <Button variant="outline">{label("outline")}</Button>
          <Button variant="ghost">{label("ghost")}</Button>
          <Button variant="accent">{label("accent")}</Button>
          <Button variant="danger">{label("danger")}</Button>
          <Button variant="link">{label("link")}</Button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Button size="sm">{label("small")}</Button>
          <Button size="md">{label("medium")}</Button>
          <Button size="lg">{label("large")}</Button>
          <Button disabled>{label("disabled")}</Button>
          <Button loading>{label("loading")}</Button>
          <Button size="icon" aria-label={label("primary")}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------------- Forms */}
      <section aria-labelledby="ds-forms" className="mt-16">
        <h2 id="ds-forms" className="font-heading text-2xl">
          {t("sections.forms")}
        </h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ds-email">{label("email")}</Label>
              <Input id="ds-email" type="email" dir="ltr" placeholder="name@example.com" />
              <p className="text-sm text-muted-foreground">{label("emailHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds-password">{label("password")}</Label>
              <Input
                id="ds-password"
                type="password"
                dir="ltr"
                aria-invalid
                aria-describedby="ds-password-error"
                defaultValue="short"
              />
              <p id="ds-password-error" className="text-sm text-danger">
                {label("passwordError")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds-disabled">{label("email")}</Label>
              <Input id="ds-disabled" disabled defaultValue="disabled@example.com" dir="ltr" />
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Checkbox id="ds-remember" defaultChecked />
              <Label htmlFor="ds-remember">{label("remember")}</Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox id="ds-notify" />
              <Label htmlFor="ds-notify">{label("notifications")}</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="ds-switch-on" defaultChecked aria-label={label("notifications")} />
              <span className="text-sm">{label("notifications")}</span>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="ds-switch-off" disabled aria-label={label("disabled")} />
              <span className="text-sm text-muted-foreground">{label("disabled")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Feedback */}
      <section aria-labelledby="ds-feedback" className="mt-16">
        <h2 id="ds-feedback" className="font-heading text-2xl">
          {t("sections.feedback")}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{label("primary")}</Badge>
          <Badge variant="primary">{label("outline")}</Badge>
          <Badge variant="accent">{label("accent")}</Badge>
          <Badge variant="success">
            <Check className="size-3" aria-hidden="true" />
            {label("successTitle")}
          </Badge>
          <Badge variant="warning">{label("loading")}</Badge>
          <Badge variant="danger">{label("danger")}</Badge>
          <Badge variant="outline" shape="pill">
            {`24`}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Alert variant="info">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <AlertTitle>{label("emailHint")}</AlertTitle>
              <AlertDescription>{label("partialBody")}</AlertDescription>
            </div>
          </Alert>

          <Alert variant="success">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <AlertTitle>{label("successTitle")}</AlertTitle>
              <AlertDescription>{label("successBody")}</AlertDescription>
            </div>
          </Alert>

          <Alert variant="warning">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <AlertTitle>{label("partialTitle")}</AlertTitle>
              <AlertDescription>{label("partialBody")}</AlertDescription>
            </div>
          </Alert>

          <Alert variant="danger">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <AlertTitle>{label("errorTitle")}</AlertTitle>
              <AlertDescription>{label("errorBody")}</AlertDescription>
            </div>
          </Alert>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>{label("emptyTitle")}</CardTitle>
              <CardDescription>{label("emptyBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm">
                {label("submit")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{label("successTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{label("successBody")}</p>
              <Badge variant="success">{label("save")}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{label("partialTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{label("partialBody")}</p>
              <Button variant="outline" size="sm">
                {label("submit")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------- Data */}
      <section aria-labelledby="ds-data" className="mt-16">
        <h2 id="ds-data" className="font-heading text-2xl">
          {t("sections.data")}
        </h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {[0, 40, 100].map((value) => (
              <div key={value} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{label("progress")}</span>
                  <span className="tabular font-medium">{`${value}%`}</span>
                </div>
                <Progress value={value} aria-label={label("progress")} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-start gap-6">
            <div className="tabular font-mono text-sm">{`0123456789 · 199.00 ر.س.`}</div>
            <Separator orientation="vertical" className="h-16" />
            <div className="tabular font-mono text-sm">{`0123456789 · SAR 199.00`}</div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Overlays */}
      <section aria-labelledby="ds-overlays" className="mt-16">
        <h2 id="ds-overlays" className="font-heading text-2xl">
          {t("sections.overlays")}
        </h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{label("tabOverview")}</TabsTrigger>
              <TabsTrigger value="notes">{label("tabNotes")}</TabsTrigger>
              <TabsTrigger value="questions">{label("tabQuestions")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground">{label("overviewBody")}</p>
            </TabsContent>
            <TabsContent value="notes">
              <p className="text-sm text-muted-foreground">{label("notesBody")}</p>
            </TabsContent>
            <TabsContent value="questions">
              <p className="text-sm text-muted-foreground">{label("questionsBody")}</p>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="danger">{label("openDialog")}</Button>
              </DialogTrigger>
              <DialogContent closeLabel={label("dialogClose")}>
                <DialogHeader>
                  <DialogTitle>{label("dialogTitle")}</DialogTitle>
                  <DialogDescription>{label("dialogBody")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary">{label("cancel")}</Button>
                  <Button variant="danger">{label("delete")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">{label("tooltipTrigger")}</Button>
                </TooltipTrigger>
                <TooltipContent>{label("tooltip")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </section>
    </div>
  );
}
