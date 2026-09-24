import { chromium } from 'playwright';
import fs from 'node:fs';

/**
 * Graba la COMPRA de verdad en www.gaviotabylia.com, con cursor visible.
 *
 * A diferencia de `capture.mjs` —que solo paseaba por cuatro pantallas— aquí
 * se pulsa: se entra a la colección desde la portada, se abre una ficha, se
 * añade a la bolsa, se abre la bolsa y se pulsa «Ir a pagar» hasta la pantalla
 * de Stripe.
 *
 * OJO: esto crea un pedido REAL en `pending_payment`, retiene inventario y
 * abre una Checkout Session en vivo. La URL final de Stripe se escribe en
 * `flow-meta.json` para poder cancelar el pedido y liberar el stock después.
 */

const BASE = 'https://www.gaviotabylia.com';
const OUT = 'brag-output/ad/raw-flow';

fs.rmSync(OUT, { recursive: true, force: true });

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
//
// El cursor se inyecta aquí porque `addInitScript` vuelve a correr en cada
// navegación: Playwright no dibuja puntero, así que sin esto la pulsación se
// ve como un salto de pantalla sin causa.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('gaviota.promotion.coupon-seen.v1', '1');
    localStorage.setItem('gaviota.consent.analytics.v1', 'granted');
  } catch {}

  const draw = () => {
    if (document.getElementById('__cur')) return;
    const s = document.createElement('style');
    s.textContent = `
      #__cur{position:fixed;left:0;top:0;width:58px;height:58px;margin:-29px 0 0 -29px;
        border-radius:50%;background:rgba(61,43,38,.22);border:2px solid rgba(61,43,38,.55);
        z-index:2147483647;pointer-events:none;opacity:0;
        transition:transform .62s cubic-bezier(.33,.9,.28,1),opacity .3s;}
      #__cur.on{opacity:1}
      #__cur.tap{transform:translate(var(--x),var(--y)) scale(.72);transition:transform .13s ease-out}
      #__ring{position:fixed;left:0;top:0;width:58px;height:58px;margin:-29px 0 0 -29px;
        border-radius:50%;border:2px solid rgba(61,43,38,.5);z-index:2147483646;
        pointer-events:none;opacity:0;}
      #__ring.go{animation:__r .5s ease-out forwards}
      @keyframes __r{from{opacity:.75;transform:translate(var(--x),var(--y)) scale(1)}
                     to{opacity:0;transform:translate(var(--x),var(--y)) scale(2.5)}}
    `;
    document.head.appendChild(s);
    for (const id of ['__ring', '__cur']) {
      const d = document.createElement('div');
      d.id = id;
      document.body.appendChild(d);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw);
  else draw();

  window.__cur = (x, y) => {
    const c = document.getElementById('__cur');
    if (!c) return;
    c.classList.add('on');
    c.style.setProperty('--x', `${x}px`);
    c.style.setProperty('--y', `${y}px`);
    c.style.transform = `translate(${x}px, ${y}px) scale(1)`;
  };
  window.__tap = () => {
    const c = document.getElementById('__cur');
    const r = document.getElementById('__ring');
    if (!c) return;
    c.classList.add('tap');
    if (r) {
      r.style.setProperty('--x', c.style.getPropertyValue('--x'));
      r.style.setProperty('--y', c.style.getPropertyValue('--y'));
      r.classList.remove('go');
      void r.offsetWidth;
      r.classList.add('go');
    }
    setTimeout(() => c.classList.remove('tap'), 190);
  };
  window.__hideCur = () => document.getElementById('__cur')?.classList.remove('on');
});

const page = await ctx.newPage();
const t0 = Date.now();
const marks = [];
const mark = (name) => {
  const t = (Date.now() - t0) / 1000;
  marks.push({ name, t });
  console.log(`  ${t.toFixed(2)}s  ${name}`);
};

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

const settle = (ms) => page.waitForTimeout(ms);

/** Lleva el cursor al elemento, lo pulsa y hace el clic real. */
async function tap(locator, { scroll = true, after = 900 } = {}) {
  if (scroll) await locator.scrollIntoViewIfNeeded();
  await settle(260);
  const box = await locator.boundingBox();
  if (!box) throw new Error('sin caja: ' + locator);
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(([x, y]) => window.__cur?.(x, y), [x, y]);
  await settle(780); // el cursor viaja: 0,62 s de transición + aire
  await page.evaluate(() => window.__tap?.());
  await settle(150);
  await locator.click();
  await settle(after);
}

// ── 1. La portada ────────────────────────────────────────────────────────────
await page.goto(`${BASE}/es`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await settle(2400);
mark('portada asentada');
await glide(0.12, 2000);
await settle(700);

// ── 2. Click que lleva a la colección ────────────────────────────────────────
await page.evaluate(() => window.scrollTo(0, 0));
await settle(600);
mark('antes del click a la coleccion');
await tap(page.getByRole('link', { name: /Descubrir la colecci/i }).first(), { after: 300 });
await page.waitForURL(/\/es\/shop/, { timeout: 15000 });
await page.evaluate(() => document.fonts.ready);
await settle(2000);
mark('tienda');
await glide(0.22, 1800);
await settle(800);

// ── 3. Click en una ficha ────────────────────────────────────────────────────
mark('antes del click a la ficha');
await tap(page.getByRole('link', { name: /Aceite Anti-Estr/i }).first(), { after: 300 });
await page.waitForURL(/\/es\/products\//, { timeout: 15000 });
await page.evaluate(() => document.fonts.ready);
await settle(2200);
mark('ficha');

// ── 4. Añadir a la bolsa ─────────────────────────────────────────────────────
mark('antes de anadir a la bolsa');
// El texto visible del botón vive en un <span aria-hidden="true">, así que su
// nombre accesible NO es «Añadir a la bolsa» y `getByRole` devuelve 0. Se
// localiza por contenido; el primero es el botón en línea de la ficha, no el
// de la barra fija inferior.
await tap(page.locator('button', { hasText: /Añadir a la bolsa/ }).first(), { after: 1900 });
mark('anadido (el contador sube)');

// ── 5. Abrir la bolsa desde la cabecera ──────────────────────────────────────
await page.evaluate(() => window.scrollTo(0, 0));
await settle(700);
mark('antes de abrir la bolsa');
await tap(page.locator('header a[href$="/cart"]').first(), { after: 300 });
await page.waitForURL(/\/es\/cart/, { timeout: 15000 });
await page.evaluate(() => document.fonts.ready);
await settle(2400);
mark('bolsa');
await glide(0.4, 1800);
await settle(1200);

// ── 6. Ir a pagar → Stripe ───────────────────────────────────────────────────
mark('antes de ir a pagar');
await tap(page.locator('button', { hasText: /Ir a pagar/ }).first(), { after: 400 });
await page.evaluate(() => window.__hideCur?.());
mark('pulsado ir a pagar');
await page.waitForURL(/checkout\.stripe\.com/, { timeout: 40000 });
await settle(3600);
mark('stripe');
const stripeUrl = page.url();
await settle(1200);

await page.close();
await ctx.close();
await browser.close();

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.webm'));
fs.writeFileSync(
  'brag-output/ad/flow-meta.json',
  JSON.stringify({ stripeUrl, marks, files, recordedAt: new Date().toISOString() }, null, 2),
);
console.log('\ngrabado:', files.join(', '));
console.log('stripe:', stripeUrl);
