# Veil — Cinematic Hero Section

A single-page hero on a pure black background, no video layer (you'll add it later). Branding swapped from "Aethera" to "Veil" per your build bible, with colors inverted for legibility on black.

## What I'll build

**Route:** Replace `src/routes/index.tsx` placeholder with the hero.

**Fonts:** Load Instrument Serif (display) + Inter (body) via `<link>` tags in `src/routes/__root.tsx` head (per Tailwind v4 rules — no `@import` of remote URLs in CSS). Register `--font-display` and `--font-sans` in `src/styles.css` `@theme`.

**Animations:** Add `fade-rise`, `fade-rise-delay`, `fade-rise-delay-2` keyframes/utilities in `src/styles.css` (0.8s ease-out, translateY 20→0, opacity 0→1, with 0s/0.2s/0.4s delays).

**Layout:**
- Container: `relative min-h-screen w-full overflow-hidden bg-black`
- Empty `z-0` layer placeholder + comment marking where to drop the video later
- Gradient overlay: `absolute inset-0 bg-gradient-to-b from-black via-transparent to-black`
- Nav (`z-10`): `Veil®` logo (Instrument Serif, text-3xl, white), menu items Home (white) / Studio / About / Journal / Reach Us (#6F6F6F, text-sm), "Begin Journey" pill button — white bg, black text, rounded-full, px-6 py-2.5, hover scale 1.03
- Hero (`z-10`): paddingTop `calc(8rem - 75px)`, pb-40, centered
  - Headline: "Beyond silence, we build the eternal." — text-5xl→8xl responsive, Instrument Serif, line-height 0.95, letter-spacing -2.46px, white with "silence," and "the eternal." italic in #6F6F6F, `animate-fade-rise`
  - Description: Inter, text-base→lg, max-w-2xl, mt-8, #6F6F6F, `animate-fade-rise-delay`
  - CTA: "Begin Journey", rounded-full, px-14 py-5, white bg + black text, mt-12, hover scale 1.03, `animate-fade-rise-delay-2`

## Color mapping (inverted for black bg)
- Background: `#000000`
- Headline / logo / primary nav item / button bg: `#FFFFFF`
- De-emphasized text (italic words, menu items, description): `#6F6F6F`
- Button text: `#000000`

## Files touched
1. `src/styles.css` — register fonts in `@theme`, add `fade-rise*` keyframes + utilities (via `@utility`)
2. `src/routes/__root.tsx` — add Google Fonts `<link>` tags to head
3. `src/routes/index.tsx` — replace placeholder with `<Hero />`
4. `src/components/Hero.tsx` — new component containing nav + hero

No video element, no `useRef`/`useEffect` loop logic (deferred until you add your video). I'll leave a clearly marked `{/* video goes here */}` slot at `z-0` so dropping in your `<video>` later is one edit.