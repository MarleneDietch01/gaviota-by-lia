/**
 * QA visual multi-viewport.
 *
 *   node scripts/visual-check.mjs <url> <dir-salida> [etiqueta]
 *
 * Captura la home completa en los cuatro anchos de referencia y MIDE lo que no
 * se puede juzgar de una captura: desbordamiento horizontal, elementos tapados
 * por el header fijo, geometría de la rejilla de producto y separación del
 * logotipo.
 *
 * Espera robusta antes de cada captura: fuentes listas + TODAS las imágenes
 * decodificadas. Sin esto, las secciones con carga diferida salen en blanco y
 * producen diagnósticos falsos.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] ?? 'http://localhost:3000/es';
const OUT = process.argv[3] ?? '.';
const TAG = process.argv[4] ?? 'now';

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const report = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });

  // Recorre la página para disparar la carga diferida y las animaciones de
  // entrada.
  //
  // Se mide con `documentElement.scrollHeight`, NO con `body.scrollHeight`: el
  // body puede reportar menos altura que el documento, el bucle se detenía antes
  // de llegar al final y las últimas secciones nunca entraban en el viewport.
  // Sus `IntersectionObserver` no disparaban y salían a opacidad 0 en la
  // captura — dos bloques con contenido real parecían vacíos.
  await page.evaluate(async () => {
    const height = () => document.documentElement.scrollHeight;
    for (let y = 0; y <= height(); y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, height());
    await new Promise((r) => setTimeout(r, 1200));
  });

  await page.evaluate(() => document.fonts.ready);
  await page
    .waitForFunction(
      () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
      { timeout: 30_000 },
    )
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  // --- Medidas -------------------------------------------------------------
  const m = await page.evaluate(() => {
    const doc = document.documentElement;

    const header = document.querySelector('header');
    const headerH = header ? Math.round(header.getBoundingClientRect().height) : 0;

    // Separación real del logotipo: hueco entre "Gaviota" y "by Lia".
    const logo = document.querySelector('header a[href$="/es"], header a[href$="/en"]');
    let logoGap = null;
    if (logo) {
      const span = logo.querySelector('span');
      if (span) {
        const r = span.getBoundingClientRect();
        const range = document.createRange();
        range.setStart(logo.firstChild, 0);
        range.setEnd(logo.firstChild, logo.firstChild.textContent.length);
        const wordRect = range.getBoundingClientRect();
        logoGap = Math.round((r.left - wordRect.right) * 100) / 100;
      }
    }

    // Geometría de las tarjetas de producto.
    const cards = [...document.querySelectorAll('#collection article')];
    const cardTops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
    const priceTops = [...document.querySelectorAll('#collection .tabular')].map((p) =>
      Math.round(p.getBoundingClientRect().top),
    );

    // Altura ocupada por el producto dentro de su tile (escala óptica).
    const imgBoxes = [...document.querySelectorAll('#collection article img')].map((img) => {
      const box = img.getBoundingClientRect();
      const nat = img.naturalWidth / img.naturalHeight;
      const boxRatio = box.width / box.height;
      // object-contain: el alto renderizado real depende de la relación.
      const drawnH = boxRatio > nat ? box.height : box.width / nat;
      return Math.round(drawnH);
    });

    return {
      overflowX: doc.scrollWidth - doc.clientWidth,
      pageHeight: doc.scrollHeight,
      headerH,
      logoGap,
      cardTops,
      priceTops,
      imgBoxes,
      scrollPaddingTop: getComputedStyle(doc).scrollPaddingTop,
    };
  });

  report.push({ viewport: vp.name, ...m });

  await page.screenshot({
    path: path.join(OUT, `${TAG}-${vp.name}-full.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 70,
  });
  await page.screenshot({
    path: path.join(OUT, `${TAG}-${vp.name}-fold.jpg`),
    type: 'jpeg',
    quality: 82,
  });

  await context.close();
}

// --- Comprobación de ancla con header fijo ---------------------------------
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${URL}#collection`, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(1500);
const anchor = await page.evaluate(() => {
  const header = document.querySelector('header');
  const target = document.querySelector('#collection');
  if (!target) return null;
  const h = header ? header.getBoundingClientRect().height : 0;
  const t = target.getBoundingClientRect().top;
  const title = document.querySelector('#collection-title');
  return {
    headerH: Math.round(h),
    sectionTop: Math.round(t),
    titleTop: title ? Math.round(title.getBoundingClientRect().top) : null,
    hiddenBehindHeader: title
      ? Math.round(h - title.getBoundingClientRect().top)
      : null,
  };
});
await context.close();
await browser.close();

console.log('\n=== MEDIDAS ===');
for (const r of report) {
  console.log(
    `${r.viewport.padStart(4)}px  overflowX=${r.overflowX}  header=${r.headerH}px  logoGap=${r.logoGap}px  scrollPadTop=${r.scrollPaddingTop}`,
  );
  console.log(`        alturas de producto renderizadas: [${r.imgBoxes.join(', ')}]`);
  console.log(`        top de precios: [${r.priceTops.join(', ')}]`);
}
console.log('\n=== ANCLA #collection (1440) ===');
console.log(JSON.stringify(anchor, null, 2));
