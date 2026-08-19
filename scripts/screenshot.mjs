/**
 * Captura la home en escritorio y móvil para revisión visual.
 *
 *   node scripts/screenshot.mjs <url> <directorio-de-salida>
 */
import { chromium } from 'playwright';
import path from 'node:path';

const URL = process.argv[2] ?? 'http://127.0.0.1:3111';
const OUT = process.argv[3] ?? '.';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    ...(vp.isMobile ? { hasTouch: true } : {}),
  });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });
  // Las imágenes con lazy loading solo se cargan al entrar en viewport: se
  // recorre la página para forzarlas antes de la captura completa.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollBy(0, window.innerHeight);
        y += window.innerHeight;
        if (y < document.body.scrollHeight) setTimeout(step, 100);
        else {
          window.scrollTo(0, 0);
          setTimeout(resolve, 400);
        }
      };
      step();
    });
  });
  await page.waitForTimeout(800);

  // Primera pantalla
  await page.screenshot({ path: path.join(OUT, `home-${vp.name}-fold.jpg`), type: 'jpeg', quality: 82 });

  // Página completa
  await page.screenshot({
    path: path.join(OUT, `home-${vp.name}-full.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 72,
  });

  // Comprobación de desbordamiento horizontal: el body nunca debe scrollear
  // en horizontal, en ningún breakpoint.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  console.log(`${vp.name.padEnd(8)} ${vp.width}px  overflow-x: ${overflow ? '❌ SÍ' : '✓ no'}`);

  await context.close();
}

await browser.close();
