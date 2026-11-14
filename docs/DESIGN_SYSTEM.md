# DESIGN_SYSTEM — Midad

> This is the visual contract for every screen: tokens, typography,
> spacing, motion, direction rules, and the terminology glossary. It is enforced by
> `src/styles/globals.css` (the tokens) and by lint rules (physical-property ban, no raw colors).
>
> Contrast numbers below are **computed, not estimated** — reproducible with
> `python3 -I tools/contrast.py` (37 pairs, exits non-zero if any pair regresses).

## 1. Visual direction — "حبر وورق" (ink & paper)

The name _Midad_ (ink) sets the metaphor: warm paper, dark ink, and a single saffron accent used
sparingly. Reference quality bar: **Linear** for precision, **Stripe Docs** for clarity,
**Coursera** for learning structure — but never their colours, layouts or copy.

What that means concretely:

- Warm off-white paper (`#FAF8F4`) instead of pure white pages; true white is reserved for
  surfaces (cards, sheets) so elevation is readable without heavy shadows.
- One ink blue for actions and one saffron for emphasis. Saffron never appears more than once per
  viewport as a _filled_ element (progress, active badge, star rating), so it keeps its meaning.
- Generous, deliberate whitespace; a strict 4px grid; hierarchy carried by size and weight,
  not by colour or decoration.
- Type does the work: tight heading scale, comfortable Arabic line-height, tabular figures for
  numbers in tables and prices.

**Acceptance test (from the product requirements):** remove the logo from any page — if it could belong to a
generic SaaS template, redesign it.

---

## 2. Colour tokens

Defined once in `src/styles/globals.css` as CSS custom properties and mirrored into Tailwind v4
via `@theme inline`. **No component may hard-code a hex value** (enforced by a lint rule on
`className`/`style` literals; exceptions require a comment explaining why).

### 2.1 Light

| Token                  | Value     | Role                                                                           | Measured contrast                |
| ---------------------- | --------- | ------------------------------------------------------------------------------ | -------------------------------- |
| `--background`         | `#FAF8F4` | page (paper)                                                                   | —                                |
| `--surface`            | `#FFFFFF` | cards, sheets, popovers                                                        | —                                |
| `--foreground`         | `#1A1F26` | primary text                                                                   | 15.61 on page · 16.56 on surface |
| `--muted-foreground`   | `#5B6470` | secondary text, hints, labels                                                  | 5.65 on page · 6.00 on surface   |
| `--primary`            | `#16385F` | buttons, links, focus ring                                                     | 11.22 on page · 11.90 on surface |
| `--primary-foreground` | `#FFFFFF` | label on primary fill                                                          | 11.90 on primary                 |
| `--accent`             | `#C8891A` | saffron **fill** (badge, chip, marker)                                         | label ink on it: 5.56            |
| `--accent-foreground`  | `#1A1F26` | label on accent fill                                                           | 5.56 on accent                   |
| `--accent-strong`      | `#9C6712` | saffron **for glyphs/text**: stars, icons, progress, accent text               | 4.54 on page · 4.81 on surface   |
| `--success`            | `#1F7A4D` | success text/border                                                            | 5.01 on page (white on it: 5.32) |
| `--warning`            | `#A55F00` | warning text/border                                                            | 4.67 on page                     |
| `--danger`             | `#B42318` | error text, destructive                                                        | 6.20 on page (white on it: 6.57) |
| `--border`             | `#E6E1D8` | **decorative** dividers only                                                   | 1.30 — intentionally low         |
| `--border-strong`      | `#8F887A` | boundaries that _identify_ a control (inputs, unchecked boxes, table outlines) | 3.52 on surface · 3.32 on page   |
| `--ring`               | `#16385F` | focus ring                                                                     | see `--primary`                  |

### 2.2 Dark

| Token                  | Value     | Role                                      | Measured contrast                |
| ---------------------- | --------- | ----------------------------------------- | -------------------------------- |
| `--background`         | `#0E1217` | page                                      | —                                |
| `--surface`            | `#161B22` | cards, sheets, popovers                   | —                                |
| `--foreground`         | `#E8EAED` | primary text                              | 15.59 on page · 14.35 on surface |
| `--muted-foreground`   | `#9AA3AE` | secondary text                            | 7.36 on page · 6.77 on surface   |
| `--primary`            | `#7FA8D9` | buttons, links, focus ring                | 7.61 on page · 7.01 on surface   |
| `--primary-foreground` | `#0E1217` | label on primary fill                     | 7.61 on primary                  |
| `--accent`             | `#E3A93D` | saffron fill                              | label ink on it: 8.96            |
| `--accent-foreground`  | `#0E1217` | label on accent fill                      | 8.96 on accent                   |
| `--accent-strong`      | `#E3A93D` | glyphs/text/progress (same value in dark) | 8.96 on page · 8.24 on surface   |
| `--success`            | `#4ADE9B` | 10.93 on page                             |                                  |
| `--warning`            | `#E9A23B` | 8.68 on page                              |                                  |
| `--danger`             | `#F98080` | 7.54 on page                              |                                  |
| `--border`             | `#2A313A` | decorative dividers only                  | 1.32 — intentionally low         |
| `--border-strong`      | `#6B7684` | control boundaries                        | 3.75 on surface · 4.07 on page   |
| `--ring`               | `#7FA8D9` | focus ring                                | see `--primary`                  |

### 2.3 Why the palette differs from the starting table (documented per the product requirements)

the product requirements permits adjusting shades **on condition that WCAG AA is kept and the ratios are
documented** — which is exactly what happened (see `docs/DECISIONS.md` ADR-0010):

| Change                                    | Reason                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Added `--accent-strong` (`#9C6712` light) | The starting saffron `#C8891A` measures **2.81:1** on paper — below the 3:1 required for meaningful graphics and far below 4.5:1 for text. Stars convey the rating, so they must be legible. `--accent` keeps its warm character for **fills** (where the ink label reaches 5.56:1) and `--accent-strong` is used for glyphs, progress fills and accent text. |
| `--warning` light `#B26A00 → #A55F00`     | 4.00:1 → 4.67:1; the original failed AA for text.                                                                                                                                                                                                                                                                                                             |
| Added `--border-strong`                   | The starting `--border` is a 1.3:1 hairline. It is fine as a decorative divider but cannot be the only boundary of a text input (WCAG 1.4.11 needs 3:1). `--border-strong` (3.32–3.52:1 light, 3.75–4.07:1 dark) is mandatory for controls.                                                                                                                   |
| `--primary-foreground` explicit           | In dark mode the primary fill is light, so its label must be ink (`#0E1217`), not white.                                                                                                                                                                                                                                                                      |
| Empty `#0E1217`/`#161B22` etc. kept as-is | They already pass with large margins.                                                                                                                                                                                                                                                                                                                         |

### 2.4 Colour rules

1. Colour is never the only carrier of meaning (status chips pair colour + icon + text;
   the rating pairs stars + number).
2. `--border` may not outline an interactive control. If a boundary identifies a control, it uses
   `--border-strong`.
3. `--accent-strong` is the only saffron permitted for text/icons on a page background.
   **No tinted-background-plus-coloured-text combinations.** A 10% semantic tint under its own
   text measured 3.9–4.4:1 and failed AA. Badges therefore use a solid semantic
   fill with its matching `*-foreground`, and alerts stay on `--surface` with the colour in the
   border and the text.
4. Focus is always `--ring` at 2px with a 2px offset — never removed.
5. Semantic tokens only: `text-muted-foreground`, `bg-surface`, `border-border-strong`. Raw hex,
   `text-white`, `bg-gray-100` etc. are lint errors in `src/**`.

---

## 3. Typography

### 3.1 Families (self-hosted via `next/font`)

| Role        | Family                   | Axis used       |
| ----------- | ------------------------ | --------------- |
| Headings    | **Readex Pro**           | 400 / 500 / 600 |
| Arabic body | **IBM Plex Sans Arabic** | 400 / 500 / 600 |
| Latin body  | **IBM Plex Sans**        | 400 / 500 / 600 |
| Code        | **IBM Plex Mono**        | 400 / 500       |

Only weights **400, 500, 600** exist in the system. `bold` (700) is forbidden — emphasis is
expressed with weight 600 plus colour or size. Arabic never falls back to a system font
(verified visually in the browser protocol: connected letterforms, correct punctuation side).

### 3.2 Scale

| Token       | Size | Line-height (ar) | Line-height (en) | Use                                    |
| ----------- | ---- | ---------------- | ---------------- | -------------------------------------- |
| `text-xs`   | 12px | 1.7              | 1.55             | meta, table captions, badges           |
| `text-sm`   | 14px | 1.7              | 1.55             | secondary UI, labels, table cells      |
| `text-base` | 16px | 1.7              | 1.55             | body, inputs (**Arabic minimum size**) |
| `text-lg`   | 18px | 1.7              | 1.55             | lead paragraph, card titles            |
| `text-xl`   | 20px | 1.6              | 1.45             | section intros                         |
| `text-2xl`  | 24px | 1.5              | 1.35             | card/section headings (h3)             |
| `text-3xl`  | 30px | 1.4              | 1.3              | page section (h2)                      |
| `text-4xl`  | 36px | 1.3              | 1.2              | page title (h1) mobile                 |
| `text-5xl`  | 48px | 1.2              | 1.15             | hero (h1) desktop                      |

Rules: one `h1` per page; heading levels never skip; `text-balance` on headings of ≤ 2 lines and
`text-pretty` on body paragraphs; no letter-spacing hacks on Arabic (it breaks joining).
Numbers in tables, prices, durations and stat blocks use **tabular figures** (`font-variant-numeric: tabular-nums`).

---

## 4. Space, layout, shape, elevation

- **Space scale (4px grid):** 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 (`space-*` Tailwind steps *4).
  Only these steps are used; arbitrary values like `p-[13px]` are lint errors.
- **Container:** max-width **1280px**, gutters 16px (mobile) / 24px (≥768) / 32px (≥1280).
- **Header:** height **64px** (56px below 768px with the same 4px-grid logic).
- **Radii:** `6px` fields & badges · `10px` buttons & cards · `14px` dialogs/sheets · `9999px` avatars & pills.
  One radius per component — never mixed inside a single control.
- **Elevation (two levels only):**
  - `shadow-sm`: `0 1px 2px rgb(26 31 38 / 0.06), 0 1px 1px rgb(26 31 38 / 0.04)`
  - `shadow-md`: `0 8px 24px -8px rgb(26 31 38 / 0.16), 0 2px 6px -2px rgb(26 31 38 / 0.08)`
    Dark theme re-declares both with pure-black alpha and a subtle `--border` edge instead of increasing blur.
- **Grid of layouts:** marketing pages use an asymmetric 12-column grid where the content column is
  `8/12` (never full-bleed text), dashboards use a 12-column grid with a 240px start-side nav (mirrored in RTL).

---

## 5. Motion

| Interaction                       | Duration    | Easing                       |
| --------------------------------- | ----------- | ---------------------------- |
| Hover/press/colour/opacity states | **150ms**   | `cubic-bezier(0.2, 0, 0, 1)` |
| Dialog/sheet/popover enter & exit | **250ms**   | `cubic-bezier(0.2, 0, 0, 1)` |
| Layout/list reorder (dnd-kit)     | 200ms       | `cubic-bezier(0.2, 0, 0, 1)` |
| Lottie (rare moments only)        | as authored |                              |

Rules:

1. Every animation is disabled under `@media (prefers-reduced-motion: reduce)` — including Lottie,
   which then shows a static first frame.
2. Motion never blocks input; no animation longer than 300ms except a Lottie moment.
3. Animate only `transform` and `opacity` (plus `height` for accordions where unavoidable).
4. No decorative looping motion in dashboards (the product requirements).

---

## 6. Direction (RTL / LTR)

Bilingual isn't a translation layer: every component is built and inspected in both directions.

1. `<html lang dir>` is set on the server from the locale; `dir="rtl"` for `ar`, `ltr` for `en`.
2. **Logical properties only** — `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`,
   `border-s`, `rounded-s-*`. Lint bans `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`,
   `text-right`, `border-l`, `border-r` (enforced by lint).
3. Direction-sensitive components:
   - `Sheet`/`Drawer` open from the **start** edge.
   - Carousel/Slider: the first item is at the start; arrow keys map to visual direction (ArrowLeft
     moves toward the start in RTL).
   - Progress and Pagination fill/order from the start.
   - Breadcrumbs use a start-to-end chevron that is mirrored (`rtl:-scale-x-100`).
   - Recharts axes are reversed in RTL (`reversed` on the X axis) so time reads start→end.
   - dnd-kit: dragging uses logical axis mapping; keyboard reordering works with arrow keys in both
     directions (covered by tests).
4. **Directional icons mirror; real-world icons do not.** As stated verbatim in the product requirements:
   chevrons, arrows and "next/previous" mirror via `rtl:-scale-x-100`. Play, clock, video, camera,
   stars, upload cloud and brand marks never mirror.
5. **The video player stays LTR in both locales** (ADR-0005): time always advances left→right in
   every player, and mirroring the scrubber would invert the user's mental model of progress.
   Surrounding _page_ navigation (prev/next lesson) is still mirrored.
6. Mixed content: code, URLs, emails and reference codes (`MD-7K3P-9QX2`) are wrapped in `<bdi>` or
   `dir="ltr"`. User-authored content gets `dir="auto"`. Email, password and URL inputs are always LTR.
7. Numbers, dates and currency come only from `lib/money.ts` / `lib/dates.ts` (ADR-0008):
   `ar-SA-u-nu-latn`, Gregorian, `Intl.RelativeTimeFormat`, and currency rendered per locale
   (`199 ر.س.` vs `SAR 199`).

---

## 7. Component rules (shadcn/ui, customised — never default)

| Component         | Customisation required before use                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button            | radii 10px, 400/500 weights, 150ms states, sizes 32/36/44 (44 only on touch), primary/secondary/ghost/danger variants, loading state with a spinner and label, `aria-busy` |
| Input / Textarea  | 6px radius, `--border-strong` boundary, label above (never placeholder-only), error text under the field with an icon, `aria-describedby` wiring                           |
| Select / Combobox | Keyboard search, start-side check indicator, LTR popover content for codes/emails                                                                                          |
| Dialog / Sheet    | 14px radius, focus trap, Esc + outside click, focus returns to the trigger, `shadow-md`                                                                                    |
| Table / DataTable | server pagination, sticky header, zebra-free with `--border` row dividers, tabular numbers, card layout under 768px                                                        |
| Toast (Sonner)    | Position mirrors with direction (`bottom-start`), max 3 visible, undo action where a destructive change can be reverted                                                    |
| Tabs              | URL-backed (`?tab=`), arrow-key navigation, `aria-selected`                                                                                                                |
| Accordion         | `--border` dividers, chevron at the end side, 250ms, keyboard operable                                                                                                     |
| Progress          | `--accent-strong` fill on a `--border` track (colour + numeric percentage, never colour alone)                                                                             |
| Badge / Chip      | Pill for status (colour + icon + text), 6px radius for counts                                                                                                              |
| Skeleton          | Mirrors the exact final layout (no layout shift), `aria-hidden`, `animate-pulse` only under `motion-safe`                                                                  |

Outside shadcn, the project owns `Icon`, `EmptyState`, `LottiePlayer`, `Money`, `DateTime`,
`Avatar` (initials on a deterministic name-derived colour), `Rating` (stars + numeral), `Progress`,
`DataTable`, `ConfirmDialog`, `LanguageSwitch`, `ThemeSwitch`, `SkipLink`.

---

## 8. Required states per data surface (the product requirements)

Every list, card grid, dashboard panel and form has **five designed states**:

1. **loading** — skeleton with the final geometry (no shift), never a spinner for content areas.
2. **empty** — illustration/Lottie + a plain sentence + one action button. Copy explains _why_ it's
   empty ("لم تُنشئ دورات بعد" vs a generic "لا بيانات").
3. **error** — what happened, whether data is safe, and a retry control; never a raw error code.
4. **success** — the changed state is visible, plus a toast confirmation for non-local actions.
5. **partial** — some sections loaded, failures isolated per section with their own retry.

Forms additionally: visible labels, inline validation after blur, pending button that blocks
double-submit, focus moved to the first invalid field, inputs preserved on error, and an
unsaved-changes warning before leaving.

Destructive actions: a confirm dialog that names the item, a verb-labelled button ("احذف القسم",
not "نعم"), and undo in a toast wherever the operation is reversible.

Feedback budget: every action shows a visible result within **100ms** (optimistic or pending).

---

## 9. Accessibility baseline (WCAG 2.2 AA)

- Full keyboard operation; visible focus ring on every focusable element; logical tab order that
  follows the reading direction in both locales.
- Skip link to main content as the first focusable element.
- `aria-label` on every icon-only control; decorative icons `aria-hidden`.
- Touch targets ≥ 44×44px on mobile (visual size may be smaller with padding).
- Alt text translated in both locales; images through `next/image` with explicit dimensions and `sizes`.
- Live regions for async results (form errors, toasts, quiz timer warnings).
- axe run per page, both locales and themes: **zero** serious/critical violations.

---

## 10. Anti-slop checklist (the product requirements — binding)

Banned, without exception:

- Purple/violet gradients, gradient text, mesh/blob backgrounds, glassmorphism everywhere.
- Generic marketing copy ("أطلق العنان لإمكاناتك", "Unlock your potential", "Elevate"). Copy must be
  concrete and, where it shows a number, that number comes from the database.
- Emoji as icons; mixed icon libraries on one screen; an icon inside a coloured circle above every heading.
- The repeated "three feature cards with icons" rhythm, or any section repeated with identical cadence.
- Fake testimonials, irrelevant company logos, invented figures like "10,000+ طالب".
- Bold everywhere, heavy shadows, inconsistent radii, raw colours instead of tokens.
- Default-looking shadcn components.

Every new page is checked against this list in the browser pass (the product requirements) before its task closes.

---

## 11. Terminology glossary (English ↔ Arabic)

Use these exact terms across the UI, emails, PDFs and tests; the product requirements requires a single vocabulary.

| English           | Arabic                 | Notes                                                                 |
| ----------------- | ---------------------- | --------------------------------------------------------------------- |
| Course            | دورة                   | plural: دورات                                                         |
| Section           | قسم                    | curriculum grouping                                                   |
| Lesson            | درس                    | plural forms below                                                    |
| Instructor        | مدرّب                  | the teaching role (`instructor`), never "معلّم"                       |
| Student / Learner | متعلّم                 | the enrolled role; "طالب" is avoided in UI copy                       |
| Admin             | مدير المنصة            |                                                                       |
| Enrollment        | تسجيل                  | "مسجَّل في" = enrolled in                                             |
| Certificate       | شهادة                  |                                                                       |
| Verification code | رمز التحقق             | format `MD-XXXX-XXXX`                                                 |
| Review            | تقييم                  | plural: تقييمات; always stars + text                                  |
| Question          | سؤال                   | discussion thread                                                     |
| Reply             | رد                     |                                                                       |
| Answer (accepted) | الإجابة المعتمدة       |                                                                       |
| Note              | ملاحظة                 | private, timestamped                                                  |
| Attachment        | مرفق                   |                                                                       |
| Quiz              | اختبار                 | plural: اختبارات; never "امتحان"                                      |
| Attempt           | محاولة                 |                                                                       |
| Cart              | السلة                  |                                                                       |
| Checkout          | الدفع                  |                                                                       |
| Coupon            | كوبون                  |                                                                       |
| VAT               | ضريبة القيمة المضافة   | 15% default                                                           |
| Order             | الطلب                  |                                                                       |
| Invoice           | الفاتورة               |                                                                       |
| Refund            | استرداد                |                                                                       |
| Earnings          | الأرباح                |                                                                       |
| Payout            | طلب سحب                |                                                                       |
| Dashboard         | لوحة التحكم            | student: لوحة المتعلّم — instructor: لوحة المدرب — admin: لوحة المدير |
| Wishlist          | المفضلة                |                                                                       |
| Streak            | سلسلة الأيام المتتالية |                                                                       |

### Arabic plural forms (ICU, all six categories)

`أي {count, plural, =0 {لا دروس} one {درس واحد} two {درسان} few {# دروس} many {# درسًا} other {# درس}}`
— the same six-category treatment is required for دورات، أقسام، اختبارات، تقييمات، متعلّمون، محاولات.
Unit tests assert all six outputs (the product requirements).

---

## 12. Enforcement

| Rule                         | Enforced by                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Tokens only, no raw colours  | lint (`no-restricted-syntax` on hex/`bg-white`/`text-gray-*` in `src/**`)                  |
| Logical properties only      | lint (`no-restricted-syntax` on `ml-                                                       | mr- | pl- | pr- | left- | right- | text-left | text-right`) |
| 4px spacing scale            | lint on arbitrary spacing values + review                                                  |
| Weights 400/500/600 only     | lint on `font-bold`/`font-black`                                                           |
| Contrast ≥ AA                | `python3 -I tools/contrast.py` in CI and in `pnpm verify`                                  |
| Reduced motion honoured      | code review + a Playwright test with `reducedMotion: 'reduce'`                             |
| Five states per data surface | review checklist in the browser protocol (the product requirements) plus visual regression |
| Glossary consistency         | review of `messages/ar.json`; the i18n:check script flags identical ar/en values           |

The living catalogue of these tokens and components is the dev-only route `/[locale]/design-system`
which must be inspected in both locales and both themes before any real page
is built.
