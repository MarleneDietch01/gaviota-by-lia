# CSS 3D product shots

This is the no-build-step technique for turning a flat product image (or a few layered images: bottle + label + lid) into something that reads as a tilted, lit, physically-sitting-in-space product photo — the kind of shot Amazon/DTC brand pages use. It's CSS transforms + gradients doing the work of a camera, lights, and a floor.

Start from `assets/css-3d-packshot.html` and adapt it rather than writing this from scratch — copy the structure, swap in the real product image(s) and copy.

## 1. The 3D stage

The tilt and any depth between layers (e.g. a lid floating slightly above a jar) needs real 3D space, not just a 2D `rotate()`:

```css
.stage {
  perspective: 1400px;         /* larger = subtler, more "telephoto" look; smaller = more dramatic/wide-angle */
  perspective-origin: 50% 40%;
}
.product {
  transform-style: preserve-3d;
  transform: rotateX(8deg) rotateY(-18deg) rotateZ(0deg);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

Small rotation values go a long way — real packshots are usually tilted 10–25°, not 45°. Over-rotating is the most common way this looks fake.

## 2. Lighting: fake it with an overlay, not the image itself

Don't ask an image model to bake lighting into the product image — control it in CSS so it matches the rest of the page and reacts to hover. Layer a lighting gradient *on top of* the product image inside the same tilted element:

```css
.product::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg,
      rgba(255,255,255,0.35) 0%,
      rgba(255,255,255,0.08) 25%,
      rgba(0,0,0,0) 50%,
      rgba(0,0,0,0.18) 80%,
      rgba(0,0,0,0.32) 100%);
  mix-blend-mode: overlay;
  pointer-events: none;
  border-radius: inherit;
}
```

The gradient angle should point roughly from where your imagined light source is (commonly upper-left) toward the opposite corner: bright/highlight near the light, a neutral middle, darkening toward the far edge. `mix-blend-mode: overlay` (or `soft-light`) lets it read as light hitting a surface rather than a flat tint sitting over the image.

## 3. Contact shadow, not a drop-shadow

A uniform `box-shadow` under the whole object reads as a shape with a gray blob behind it. A real contact shadow is tight and dark directly under the object and fades out — use a separate flattened ellipse element, not `box-shadow`:

```css
.contact-shadow {
  position: absolute;
  bottom: -6%;
  left: 50%;
  width: 70%;
  height: 14%;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 75%);
  transform: translateX(-50%) rotateX(85deg);
  filter: blur(4px);
}
```

Optionally add a second, larger/softer/lighter ellipse behind it for ambient shadow — same layered-shadow idea as Part 1's elevation guidance.

## 4. Reflection (use sparingly — only when the surface below implies a glossy floor)

A believable reflection is a flipped, faded, slightly compressed copy of the product, not a mirrored full-opacity duplicate:

```css
.reflection {
  transform: scaleY(-1) scaleY(0.55);
  transform-origin: bottom;
  opacity: 0.25;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 70%);
  filter: blur(1px);
}
```

Skip reflections entirely on a matte/paper background — they only make sense implying glass, glossy plastic, or a studio floor.

## 5. Background

Never place the product on flat pure white — it's what makes AI product shots look like a cutout pasted on a slide. Use a very subtle radial or linear gradient (e.g. a soft vignette from a light neutral to a slightly darker/tinted edge), or a large soft-blurred colored blob behind the product picking up the brand accent color. This alone does a lot of the "photography" illusion.

## 6. Interactive hover-tilt (optional, adds a lot of perceived polish)

Track the pointer and adjust `rotateX`/`rotateY` proportionally so the product tilts toward the cursor — this is what libraries like Atropos.js and Vanilla-Tilt.js do; for a single self-contained file it's ~15 lines of vanilla JS and avoids a dependency:

```js
const stage = document.querySelector('.stage');
const product = document.querySelector('.product');
stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
  const py = (e.clientY - r.top) / r.height - 0.5;
  product.style.transform = `rotateX(${8 - py * 16}deg) rotateY(${-18 + px * 24}deg)`;
});
stage.addEventListener('pointerleave', () => {
  product.style.transform = `rotateX(8deg) rotateY(-18deg)`;
});
```

If the project already pulls in npm packages, Atropos (`https://github.com/nk-o/atropos`) gives multi-layer parallax tilt (separate depth for label vs. bottle vs. lid) with less hand-written code — reach for it when there are 3+ visual layers that should move at different depths, otherwise the vanilla version above is enough and keeps the file dependency-free.

## Common failure modes and fixes

- **Looks like a sticker**: missing the lighting overlay (step 2) and/or contact shadow (step 3) — these two do most of the work.
- **Looks like it's floating**: contact shadow too far from the object, too soft, or too light. Bring it closer, tighten the ellipse, darken the core.
- **Looks over-rendered/plasticky**: lighting gradient opacity too high, or reflection too opaque. Lower both — subtlety is what reads as "real photo" rather than "3D render".
- **Tilt looks distorted/warped**: `perspective` value too small (too wide-angle) for how large the element is on screen. Increase it, or reduce rotation angles.
