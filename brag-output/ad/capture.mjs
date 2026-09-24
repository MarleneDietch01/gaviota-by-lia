import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://www.gaviotabylia.com';
const OUT = 'brag-output/ad/raw';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 486, height: 1050 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
  recordVideo: { dir: OUT, size: { width: 486, height: 1050 } },
});

// El cupón y el aviso de cookies son reales y correctos, pero en un anuncio
// tapan justo lo que se quiere enseñar. Se marcan como ya resueltos, que es
// el estado de cualquier visitante que vuelve.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('gaviota.promotion.coupon-seen.v1', '1');
    localStorage.setItem('gaviota.consent.analytics.v1', 'granted');
  } catch {}
});

const page = await ctx.newPage();

// Desplazamiento suave a mano: `scrollTo` a saltos pequeños da un movimiento
// continuo en vídeo, que es lo que no consigue `behavior: smooth`.
async function glide(toRatio, ms) {
  await page.evaluate(
    ([ratio, duration]) =>
      new Promise((done) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const from = window.scrollY;
        const to = Math.min(max, max * ratio);
        const t0 = performance.now();
        const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
        (function step(now) {
          const p = Math.min(1, (now - t0) / duration);
          window.scrollTo(0, from + (to - from) * ease(p));
          if (p < 1) requestAnimationFrame(step);
          else done();
        })(t0);
      }),
    [toRatio, ms],
  );
  await page.waitForTimeout(ms + 120);
}

const settle = async (ms = 1400) => page.waitForTimeout(ms);

// 1 — la portada
await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await settle(2200);
await glide(0.14, 2600);
await settle(900);
await glide(0.3, 2400);
await settle(900);

// 2 — el catálogo
await page.goto(`${BASE}/es/shop`, { waitUntil: 'domcontentloaded' });
await settle(2000);
await glide(0.34, 2800);
await settle(1000);

// 3 — la ficha
await page.goto(`${BASE}/es/products/aceite-anti-estrias`, { waitUntil: 'domcontentloaded' });
await settle(2000);
await glide(0.18, 2200);
await settle(1200);

// 4 — la compra
const add = page.getByRole('button', { name: /Añadir.*bolsa/i }).first();
if (await add.count()) {
  await add.first().click();
  await settle(1600);
}

// 5 — la bolsa
await page.goto(`${BASE}/es/cart`, { waitUntil: 'domcontentloaded' });
await settle(2600);
await glide(0.55, 2200);
await settle(1800);

await page.close();
await ctx.close();
await browser.close();

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'));
console.log('grabado:', files.map((f) => `${f} (${(fs.statSync(`${OUT}/${f}`).size / 1e6).toFixed(1)} MB)`).join(', '));
