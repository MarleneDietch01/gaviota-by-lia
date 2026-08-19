---
name: web-3d-product-design
description: Use whenever building or improving a website's visual design — landing pages, product pages, marketing sites, hero sections, or any UI that should look premium and modern. Provides a system for layout, typography, color, spacing, and motion, PLUS a method for realistic 3D product visuals on the web (tilted packshots with lighting/shadow/reflection, like Amazon/Apple product photography, and interactive Three.js viewers). Trigger proactively when the user asks to design/redesign a webpage, wants something to "look professional/premium/modern", builds a product or landing page, wants a product shown in 3D, needs a hero image or packshot, or mentions design quality at all — even without saying "design system" or "3D". Also trigger on Spanish requests such as "diseño web", "diseño UI/UX", "página de producto", "renders 3D de producto", "que se vea premium/profesional", or visualizing a product like an Amazon listing photo.
---

# Web & 3D Product Design

## Why this exists

Claude can write working HTML/CSS/JS easily, but "working" and "looks premium" are different bars. Most AI-generated UI reads as generic — default fonts, flat colors, boxes with equal padding, no depth — because it skips the handful of decisions that separate amateur work from professional design. This skill packages those decisions: a fast, opinionated system for UI/UX (Part 1) and a concrete method for making product renders that look like real photography instead of a flat PNG on a white card (Part 2).

Use both parts together. A landing page selling a physical product almost always benefits from a hero-section product render built with Part 2, styled inside a page built with Part 1's system.

## Before you start

Pick ONE aesthetic direction before writing any code, and hold it for the whole page. Flip-flopping between styles (glassmorphic card next to a flat-design button next to a skeuomorphic icon) is the #1 tell of ungrounded AI design. A few reference directions to choose from, or use as inspiration to define your own:

- **Editorial / premium**: generous whitespace, large serif or high-contrast sans headlines, muted neutral palette + one accent, subtle motion. (Apple, Linear, Stripe)
- **Bold / energetic**: saturated color, big type, asymmetric layout, snappy motion. (consumer apps, DTC brands, Cellucor-style supplement branding)
- **Technical / dense**: dark mode, monospace accents, tight grid, data-forward. (dev tools, dashboards)
- **Soft / friendly**: rounded corners, pastel or warm palette, illustration, gentle motion. (consumer SaaS, wellness)

State the direction in one sentence to yourself (or to the user) before building — it disciplines every choice that follows.

## Part 1 — UI/UX system

### Layout & spacing
Use an 8px base unit for all spacing and sizing (8, 16, 24, 32, 48, 64, 96...). This alone makes a layout feel intentional instead of arbitrary. Give sections generous vertical rhythm — premium sites breathe; cramped sites look cheap. Establish a max content width (typically 1200–1440px) with centered margins rather than letting text and cards stretch edge-to-edge on wide screens.

### Typography
Pick two typefaces max: one for display/headlines, one for body (they can be the same family at different weights). Use a modular type scale rather than picking sizes ad hoc — e.g. 14 / 16 / 18 / 24 / 32 / 48 / 64px, roughly ×1.25–1.333 steps. Headlines should be tighter (line-height 1.0–1.15, letter-spacing slightly negative on large sizes); body text should be looser (line-height 1.5–1.7). Good free pairings to reach for instead of system-ui: Inter/Geist + a serif like Fraunces or Newsreader for editorial; Space Grotesk or General Sans for bold/energetic; JetBrains Mono for technical accents.

### Color
Build a real palette, not "blue for primary, gray for text": one neutral scale (9–10 steps from near-white to near-black, ideally with a slight tint rather than pure gray), one primary/brand color, and 0–2 accent colors used sparingly. Check contrast — body text needs ≥4.5:1 against its background (WCAG AA); this also just tends to look more considered. Dark backgrounds should rarely be pure `#000` — a very dark tinted neutral (e.g. `#0a0a0f`) reads as more designed. Never rely on color alone to convey state (error/success) — pair with icon or text.

### Depth & elevation
Prefer soft, layered shadows over single hard drop-shadows: stack 2–3 box-shadows of increasing blur/spread and decreasing opacity to fake realistic ambient occlusion, e.g. `0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08), 0 24px 48px rgba(0,0,0,.06)`. Use this same layered-shadow idea for the 3D product renders in Part 2. Border-radius should be consistent across a design (pick one scale: e.g. 8/12/16/24px) — mixing sharp and very-rounded corners in the same view looks unintentional.

### Motion
Motion should clarify, not decorate. Favor: fade+slight-translate on scroll-into-view (translateY 12–24px, 400–600ms, ease-out), hover states that respond within 150–200ms, and page transitions under 300ms. Use `cubic-bezier(0.16, 1, 0.3, 1)` (or similar "ease-out-expo" curves) for anything that should feel premium rather than the default linear/ease. Respect `prefers-reduced-motion`.

### Quick self-check before calling a design done
Would this page still look intentional in grayscale (i.e. is hierarchy coming from size/weight/spacing, not just color)? Is there a clear single focal point above the fold? Does every spacing value trace back to the 8px scale? If any answer is no, that's the fastest lever to pull.

## Part 2 — 3D product visuals for the web

The Amazon-style product shot the user references (a tilted tub with realistic lighting, soft shadow, subtle reflection) is achievable two ways. Pick based on what the page actually needs — don't reach for Three.js by default, it's the heavier tool.

**Use CSS 3D (no build step, one file) when:** the product is represented by one or a few flat images/renders and you need a tilted "hero shot" or a hover-tilt card — this covers the large majority of landing/product page requests, including recreating something like the screenshot the user showed.

**Use Three.js/WebGL when:** the user has (or wants) an actual 3D model (`.glb`/`.gltf`), asks for something the user can rotate/drag freely, or needs multiple camera angles of the same object without separate source images.

Read `references/css-3d-product-shots.md` for the full CSS technique (perspective setup, layered lighting/shadow/reflection recipe, hover-tilt interaction) before building a packshot — it has the exact gradient/shadow recipes that make the difference between "flat sticker" and "product photo". `assets/css-3d-packshot.html` is a ready-to-copy working starting point; don't rebuild this from scratch each time, adapt it.

Read `references/threejs-product-viewer.md` before building a real 3D viewer — it covers the minimal Three.js setup (lighting rig, environment reflections, orbit controls, loading a `.glb`) and where to source or generate a product model if the user doesn't have one. `assets/threejs-viewer.html` is a working starting template.

### The core idea behind both methods
A flat product cutout reads as fake because real product photography has: a light source with direction (so one edge is brighter, the opposite has a highlight or rim light), a contact shadow that's darkest right under the object and fades out, ambient occlusion in the crevices, and often a faint reflection or the product sitting on a subtly-toned surface/background — never pure white with a hard-edged drop shadow. Both `references/` files implement this same physical model with different tools (gradients+transforms vs. actual lights+geometry). When something looks "off" in a render, it's almost always one of these four missing, not the general approach being wrong.

## Combining with other skills

This skill covers the design system and the product-render technique specifically. For adjacent needs in the same project, pull in:

- **web-artifacts-builder** — when the deliverable is a full multi-file web app/site rather than a single self-contained page; use it for the project scaffolding while applying this skill's design decisions inside it.
- **canvas-design** — for general layout/graphic composition thinking beyond product shots (posters, social graphics, non-product hero art).
- **theme-factory** — if the user wants a reusable, swappable design-token theme rather than a one-off page.
- **algorithmic-art** — for generative/abstract background art (gradients, particle fields, noise patterns) to pair with a product hero rather than photography.
- **dataviz** — if the page includes charts/stats alongside the product content; keep chart color usage consistent with this skill's Part 1 palette rules rather than treating it as a separate system.

Don't load these speculatively — only pull them in if the task actually needs what they add.
