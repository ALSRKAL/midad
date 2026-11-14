# Assets and licenses

Third-party assets used by the application, with their licenses. Binary media used by the demo
seed is generated locally and is not committed.

## Fonts

Self-hosted through `next/font` at build time; no runtime request leaves the origin.

| Font                 | Use                   | License     |
| -------------------- | --------------------- | ----------- |
| IBM Plex Sans Arabic | Arabic body text      | SIL OFL 1.1 |
| IBM Plex Sans        | Latin body text       | SIL OFL 1.1 |
| Readex Pro           | Arabic/Latin headings | SIL OFL 1.1 |
| IBM Plex Mono        | Code blocks and IDs   | SIL OFL 1.1 |

## Icons

- `lucide-react` — ISC license. Rendered as inline SVG, no icon API is called at runtime.

## Illustrations

- The Lottie files in `public/lottie` are authored for this project (empty search, payment success,
  payment failure). They are loaded only when the corresponding state is shown.
- Course covers, lesson videos and handouts are generated deterministically by the seed
  (ImageMagick and ffmpeg) and uploaded to object storage. No stock photography is shipped.

## Test media

The E2E fixture server uploads a short synthetic clip to exercise the HLS worker. The loopback
Stripe gateway is a local test double, not a third-party service.
