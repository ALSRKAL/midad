"""Compute WCAG 2.2 contrast ratios for the Midad design tokens.

Run: python3 -I tools/contrast.py
Exits non-zero if any documented pair drops below its AA minimum, so this doubles
as a CI check. No third-party dependencies; sRGB relative luminance per WCAG 2.x.

Pairs marked `decorative` are documented as *not* the sole means of identifying a
control; anything that identifies a control must use a `control` pair (>= 3.0).
"""

from __future__ import annotations


def _srgb(channel: int) -> float:
    c = channel / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _srgb(r) + 0.7152 * _srgb(g) + 0.0722 * _srgb(b)


def ratio(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# (label, foreground, background, kind)  kind: text 4.5 | control 3.0 | decorative (reported only)
PAIRS: list[tuple[str, str, str, str]] = [
    # ---------------- LIGHT ----------------
    ("LIGHT  body text on page", "#1A1F26", "#FAF8F4", "text"),
    ("LIGHT  body text on surface", "#1A1F26", "#FFFFFF", "text"),
    ("LIGHT  secondary text on page", "#5B6470", "#FAF8F4", "text"),
    ("LIGHT  secondary text on surface", "#5B6470", "#FFFFFF", "text"),
    ("LIGHT  link/primary on page", "#16385F", "#FAF8F4", "text"),
    ("LIGHT  link/primary on surface", "#16385F", "#FFFFFF", "text"),
    ("LIGHT  primary button label", "#FFFFFF", "#16385F", "text"),
    ("LIGHT  accent text/stars on page", "#9C6712", "#FAF8F4", "text"),
    ("LIGHT  accent text/stars on surface", "#9C6712", "#FFFFFF", "text"),
    ("LIGHT  accent badge label (ink on saffron)", "#1A1F26", "#C8891A", "text"),
    ("LIGHT  success text on page", "#1F7A4D", "#FAF8F4", "text"),
    ("LIGHT  warning text on page", "#A55F00", "#FAF8F4", "text"),
    ("LIGHT  danger text on page", "#B42318", "#FAF8F4", "text"),
    ("LIGHT  success chip label", "#FFFFFF", "#1F7A4D", "text"),
    ("LIGHT  danger chip label", "#FFFFFF", "#B42318", "text"),
    ("LIGHT  warning chip label", "#FFFFFF", "#A55F00", "text"),
    ("LIGHT  alert warning text on surface", "#A55F00", "#FFFFFF", "text"),
    ("LIGHT  alert success text on surface", "#1F7A4D", "#FFFFFF", "text"),
    ("LIGHT  alert danger text on surface", "#B42318", "#FFFFFF", "text"),
    ("LIGHT  alert accent text on surface", "#9C6712", "#FFFFFF", "text"),
    ("LIGHT  input/control boundary on surface", "#8F887A", "#FFFFFF", "control"),
    ("LIGHT  input/control boundary on page", "#8F887A", "#FAF8F4", "control"),
    ("LIGHT  focus ring on surface", "#16385F", "#FFFFFF", "control"),
    ("LIGHT  focus ring on page", "#16385F", "#FAF8F4", "control"),
    ("LIGHT  decorative divider on surface", "#E6E1D8", "#FFFFFF", "decorative"),
    # ---------------- DARK ----------------
    ("DARK   body text on page", "#E8EAED", "#0E1217", "text"),
    ("DARK   body text on surface", "#E8EAED", "#161B22", "text"),
    ("DARK   secondary text on page", "#9AA3AE", "#0E1217", "text"),
    ("DARK   secondary text on surface", "#9AA3AE", "#161B22", "text"),
    ("DARK   link/primary on page", "#7FA8D9", "#0E1217", "text"),
    ("DARK   link/primary on surface", "#7FA8D9", "#161B22", "text"),
    ("DARK   primary button label", "#0E1217", "#7FA8D9", "text"),
    ("DARK   accent text/stars on page", "#E3A93D", "#0E1217", "text"),
    ("DARK   accent text/stars on surface", "#E3A93D", "#161B22", "text"),
    ("DARK   accent badge label", "#0E1217", "#E3A93D", "text"),
    ("DARK   success text on page", "#4ADE9B", "#0E1217", "text"),
    ("DARK   warning text on page", "#E9A23B", "#0E1217", "text"),
    ("DARK   danger text on page", "#F98080", "#0E1217", "text"),
    ("DARK   alert warning text on surface", "#E9A23B", "#161B22", "text"),
    ("DARK   alert success text on surface", "#4ADE9B", "#161B22", "text"),
    ("DARK   alert danger text on surface", "#F98080", "#161B22", "text"),
    ("DARK   input/control boundary on surface", "#6B7684", "#161B22", "control"),
    ("DARK   input/control boundary on page", "#6B7684", "#0E1217", "control"),
    ("DARK   focus ring on surface", "#7FA8D9", "#161B22", "control"),
    ("DARK   decorative divider on surface", "#2A313A", "#161B22", "decorative"),
]

MINIMUMS = {"text": 4.5, "control": 3.0, "decorative": 0.0}


def main() -> int:
    failures = 0
    print(f"{'token pair':46s} {'ratio':>6s} {'min':>5s}  verdict")
    print("-" * 78)
    for label, fg, bg, kind in PAIRS:
        r = ratio(fg, bg)
        need = MINIMUMS[kind]
        if kind == "decorative":
            verdict = "n/a (decorative)"
        else:
            ok = r >= need
            failures += 0 if ok else 1
            verdict = "PASS" if ok else "FAIL"
        print(f"{label:46s} {r:6.2f} {need:5.1f}  {verdict}")
    print("-" * 78)
    print(f"{len(PAIRS)} pairs checked, {failures} failing")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
