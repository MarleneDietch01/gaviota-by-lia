/**
 * Pipeline de imágenes.
 *
 *   node scripts/process-images.mjs
 *
 * Lee los 17 originales de `originales/` (324 MB, entre 7 y 27 MB por archivo)
 * y produce los derivados servibles en `public/images/gaviota/`.
 *
 * Los originales NUNCA se sirven: un JPEG de 27 MB haría inalcanzable cualquier
 * objetivo de LCP. Se conservan intactos, fuera de `public/` y fuera de git.
 *
 * No se recorta a ciegas: cada imagen declara su punto focal en crops.mjs para
 * que los recortes responsivos no corten rostros ni productos.
 *
 * Genera además `image-manifest.json` con las dimensiones reales de cada
 * derivado, para que los componentes pasen `width`/`height` a next/image y el
 * CLS sea 0.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ORIGINALS,
  OUT_DIR,
  PACKSHOTS,
  FOCAL,
  COMMUNITY_ZOOM,
  PACKSHOT_CANVAS,
  PACKSHOT_BASELINE,
  PACKSHOT_SCALE,
  STUDIO_DIR,
  STUDIO_PACKSHOTS,
  STUDIO_BACKGROUND,
  LIFESTYLE_PACKSHOTS,
} from './crops.mjs';

/**
 * Calidad del INTERMEDIO, no de lo que se sirve.
 *
 * Estos JPEG nunca llegan al navegador: Next los vuelve a codificar a AVIF/WebP.
 * Son, por tanto, un artefacto de build, y cada bit que se les quita aquí se
 * pierde para siempre en una segunda generación con pérdida.
 *
 * Con el valor anterior (82 y croma 4:2:0) se medía esto sobre el hero:
 *   original a 1400px .............. detalle 7.19
 *   intermedio q82 4:2:0 ........... detalle 6.19  (-14 % ANTES de tocar AVIF)
 *   servido AVIF q75 ............... detalle 5.11  (-29 % acumulado)
 *
 * A 95 y 4:4:4 el intermedio queda visualmente indistinguible del original, y
 * toda la pérdida perceptible pasa a estar bajo el control de `quality` en
 * next/image, que es donde se puede ajustar sin volver a procesar nada.
 *
 * El croma 4:4:4 importa especialmente en esta marca: la paleta es magenta
 * saturado sobre piel y sobre ciclorama rosa, y 4:2:0 reduce a la mitad la
 * resolución de color justo en esos bordes.
 */
const QUALITY = 95;
const CHROMA = '4:4:4';
const manifest = {};

/** Recorta a una relación de aspecto respetando el punto focal. */
function focalCrop(width, height, targetRatio, focal) {
  const currentRatio = width / height;
  let cropW = width;
  let cropH = height;

  if (currentRatio > targetRatio) {
    cropW = Math.round(height * targetRatio);
  } else {
    cropH = Math.round(width / targetRatio);
  }

  const left = Math.max(0, Math.min(width - cropW, Math.round(width * focal.x - cropW / 2)));
  const top = Math.max(0, Math.min(height - cropH, Math.round(height * focal.y - cropH / 2)));

  return { left, top, width: cropW, height: cropH };
}

/** Media de un cuadrado de 24px en la esquina superior izquierda, en hex. */
async function sampleCorner(file) {
  const { channels } = await sharp(file)
    .extract({ left: 0, top: 0, width: 24, height: 24 })
    .removeAlpha()
    .stats();

  return (
    '#' +
    channels
      .slice(0, 3)
      .map((c) => Math.round(c.mean).toString(16).padStart(2, '0'))
      .join('')
  );
}

async function emit(pipeline, outPath, key) {
  await mkdir(path.dirname(outPath), { recursive: true });
  const info = await pipeline
    .jpeg({
      quality: QUALITY,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: CHROMA,
    })
    .toFile(outPath);

  manifest[key] = {
    src: '/' + path.relative('public', outPath).split(path.sep).join('/'),
    width: info.width,
    height: info.height,
    // Color del fondo, muestreado de la esquina superior izquierda.
    //
    // Los packshots se fotografiaron sobre ciclorama liso, así que ese píxel
    // ES el fondo. La tarjeta de producto pinta el tile con este color exacto,
    // y así el borde del JPEG deja de verse: el envase queda flotando sobre un
    // campo continuo en vez de dentro de un rectángulo de otro tono.
    //
    // Es la alternativa honesta a recortar el fondo: no se retoca la fotografía
    // del producto, que es justo lo que no se debe alterar.
    background: await sampleCorner(outPath),
  };

  console.log(
    `  ${key.padEnd(38)} ${String(info.width).padStart(4)}×${String(info.height).padEnd(4)}  ${(info.size / 1024).toFixed(0)} KB`,
  );
}

/** Redimensiona conservando la relación 4:5 nativa. */
async function derive(file, key, outPath, targetWidth) {
  const src = path.join(ORIGINALS, file);
  await emit(sharp(src).resize(targetWidth, null, { withoutEnlargement: true }), outPath, key);
}

/**
 * Acerca el encuadre `zoom×` sobre el punto focal, manteniendo el 4:5 nativo.
 * `zoom = 1` es equivalente a `derive` (no recorta nada).
 */
async function deriveZoom(file, key, outPath, targetWidth, zoom) {
  const src = path.join(ORIGINALS, file);
  if (zoom === 1) return derive(file, key, outPath, targetWidth);

  const meta = await sharp(src).metadata();
  const focal = FOCAL[file] ?? { x: 0.5, y: 0.5 };
  const cropW = Math.round(meta.width / zoom);
  const cropH = Math.round(meta.height / zoom);
  const left = Math.max(0, Math.min(meta.width - cropW, Math.round(meta.width * focal.x - cropW / 2)));
  const top = Math.max(0, Math.min(meta.height - cropH, Math.round(meta.height * focal.y - cropH / 2)));

  await emit(
    sharp(src)
      .extract({ left, top, width: cropW, height: cropH })
      .resize(targetWidth, null, { withoutEnlargement: true }),
    outPath,
    key,
  );
}

/** Recorta a otra relación de aspecto usando el punto focal. */
async function deriveRatio(file, key, outPath, targetWidth, ratio) {
  const src = path.join(ORIGINALS, file);
  const meta = await sharp(src).metadata();
  const focal = FOCAL[file] ?? { x: 0.5, y: 0.5 };
  const region = focalCrop(meta.width, meta.height, ratio, focal);

  await emit(
    sharp(src).extract(region).resize(targetWidth, null, { withoutEnlargement: true }),
    outPath,
    key,
  );
}

const HERO = 'LeslieEstevezPhotography-(19of19).jpg';

/* ---------------------------------------------------------------------------
   ANCHOS OBJETIVO
   ---------------------------------------------------------------------------
   Cada ancho sale de (tamaño real en pantalla × DPR), no de un número redondo.
   Los originales miden entre 4400 y 5900 px de ancho, así que la resolución
   nunca fue la limitación: los valores anteriores simplemente se quedaban
   cortos en pantallas retina, que hoy son la mayoría.

     hero.desktop  columna del 58 % → 1114 px CSS a 1920 → ×2 = 2228 → 2400
     hero.tablet   ancho completo   → hasta 1023 px CSS  → ×2 = 2046 → 1800 (*)
     hero.mobile   ancho completo   →  430 px CSS a ×3   = 1290       → 1400
     editorial     media columna    →  720 px CSS        → ×2 = 1440  → 1800
     comunidad     1/4 de rejilla   →  345 px CSS        → ×3 = 1035  → 1400

   (*) 1800 y no 2046: por encima de 1024 px de viewport ya entra el recorte de
       escritorio, y las tablets reales rondan 768-834 px CSS.
   --------------------------------------------------------------------------- */

console.log('\n── Hero ──────────────────────────────────────────────────────────');
// Escritorio: composición dividida, conserva el 4:5 nativo sin recortar nada.
await derive(HERO, 'hero.desktop', `${OUT_DIR}/hero/hero-desktop.jpg`, 2400);
await derive(HERO, 'hero.tablet', `${OUT_DIR}/hero/hero-tablet.jpg`, 1800);
// Móvil: recorte 3:4 propio, con el rostro protegido por el punto focal.
await deriveRatio(HERO, 'hero.mobile', `${OUT_DIR}/hero/hero-mobile.jpg`, 1400, 3 / 4);

console.log('\n── Editorial ─────────────────────────────────────────────────────');
const EDITORIAL = [
  ['LeslieEstevezPhotography-(7of19).jpg', 'campaign', 'campaign-aplicacion.jpg', 2000],
  // Bloque de campaña destacada (home.campaign). La 7of19 se queda para la
  // tarjeta "Hidratación" de RITUAL_NEEDS.
  ['LeslieEstevezPhotography-(16of19).jpg', 'campaign.labios', 'campaign-labios.jpg', 2000],
  ['LeslieEstevezPhotography-(15of19).jpg', 'ritual.exfolia', 'ritual-exfolia.jpg', 1600],
  ['LeslieEstevezPhotography-(7of19).jpg', 'ritual.hidrata', 'ritual-hidrata.jpg', 1600],
  ['LeslieEstevezPhotography-(16of19).jpg', 'ritual.labios', 'ritual-labios.jpg', 1600],
  ['LeslieEstevezPhotography-(2of19).jpg', 'story.founder', 'story-fundadora.jpg', 1800],
  ['LeslieEstevezPhotographyGA15.jpg', 'journal.bts', 'journal-tras-camaras.jpg', 1600],
];
for (const [file, key, name, w] of EDITORIAL) {
  await derive(file, key, `${OUT_DIR}/editorial/${name}`, w);
}

console.log('\n── Fundadora ─────────────────────────────────────────────────────');
for (const n of [1, 2, 3, 4, 5, 6]) {
  await derive(
    `LeslieEstevezPhotography-(${n}of19).jpg`,
    `founder.${n}`,
    `${OUT_DIR}/founder/fundadora-${n}.jpg`,
    1600,
  );
}

console.log('\n── Comunidad ─────────────────────────────────────────────────────');
// La 9 y la 11 se acercan al encuadre; la 17 y la 18 pasan con zoom 1 (sin
// recorte). Ver `COMMUNITY_ZOOM` en crops.mjs.
for (const n of [9, 11, 17, 18]) {
  await deriveZoom(
    `LeslieEstevezPhotography-(${n}of19).jpg`,
    `community.${n}`,
    `${OUT_DIR}/community/comunidad-${n}.jpg`,
    1400,
    COMMUNITY_ZOOM[n],
  );
}

/* ---------------------------------------------------------------------------
   PACKSHOTS — límite real del material, documentado
   ---------------------------------------------------------------------------
   Se extraen de GA9.jpg (4431×5539), el único bodegón con las etiquetas
   legibles. Cada envase ocupa entre 520 y 1180 px de ancho DENTRO de esa foto,
   así que ese es el techo físico: no hay más píxeles que recortar.

   La versión anterior encadenaba `.resize(1200, { withoutEnlargement: true })`
   con un comentario afirmando que el recorte quedaba "por encima de los 1200 px
   que necesita la ficha". Es falso para los siete: al ser todos más estrechos,
   `withoutEnlargement` convertía ese resize en una operación nula. Se elimina
   el resize en lugar de subirlo, porque ampliar aquí solo inventaría píxeles.

   Se avisa por consola de los que no llegan al ancho cómodo para una ficha de
   producto, para que quede constancia en cada ejecución.
   --------------------------------------------------------------------------- */
console.log('\n── Packshots (extraídos de GA9) ──────────────────────────────────');
const PDP_COMFORTABLE_WIDTH = 900;
const thin = [];

const GA9 = path.join(ORIGINALS, 'GA9.jpg');

/**
 * Plato de fondo común a todos los packshots.
 *
 * Es un campo liso del color MEDIO del ciclorama en los siete recortes, no una
 * región concreta de GA9. La primera versión usaba una zona fija de la foto y
 * salía más saturada que el fondo propio de cada recorte: alrededor de cada
 * envase quedaba un halo rectangular perfectamente visible.
 *
 * Promediando los siete, la diferencia con cada recorte baja a unas pocas
 * unidades de 8 bits, y el difuminado de borde la disuelve del todo. Además
 * garantiza que las cuatro tarjetas de la rejilla compartan EXACTAMENTE el
 * mismo fondo, que es lo que se pedía.
 */
/**
 * Fondo real de un recorte.
 *
 * Se mide en dos franjas verticales de 26px pegadas a los bordes izquierdo y
 * derecho, que en todos los recortes son ciclorama puro. Muestrear una esquina
 * de 40×40 no servía: el ciclorama tiene degradado y la esquina caía en zonas
 * más claras que el fondo que rodea al envase, lo que producía un halo
 * rectangular — más claro o más oscuro según el producto.
 */
async function cropBackground(c) {
  const strips = [
    { left: c.left, top: c.top, width: 26, height: c.height },
    { left: c.left + c.width - 26, top: c.top, width: 26, height: c.height },
  ];

  const means = [];
  for (const strip of strips) {
    const { channels } = await sharp(GA9).extract(strip).removeAlpha().stats();
    means.push(channels.slice(0, 3).map((ch) => ch.mean));
  }

  return [0, 1, 2].map((i) => (means[0][i] + means[1][i]) / 2);
}

const BACKGROUNDS = new Map();
for (const c of PACKSHOTS) {
  BACKGROUNDS.set(c.slug, await cropBackground(c));
}

/** Objetivo común: la media de los fondos reales de los siete recortes. */
const TARGET = [0, 1, 2].map((i) => {
  const all = [...BACKGROUNDS.values()];
  return all.reduce((s, v) => s + v[i], 0) / all.length;
});

const PLATE_COLOR = {
  r: Math.round(TARGET[0]),
  g: Math.round(TARGET[1]),
  b: Math.round(TARGET[2]),
};
console.log(
  `  plato común: rgb(${PLATE_COLOR.r}, ${PLATE_COLOR.g}, ${PLATE_COLOR.b})`,
);

/*
 * El lienzo se construye con `extend`, NO con `composite`.
 *
 * sharp compone en luz lineal, y el viaje de ida y vuelta a sRGB desplazaba el
 * color de TODO el lienzo por un factor uniforme de 0,91 — medido: un plato de
 * rgb(231,160,163) salía como rgb(210,146,149), y con desplazamientos distintos
 * según el producto. Eso rompía justo lo que se quería conseguir: que los siete
 * fondos fuesen idénticos.
 *
 * `extend` rellena con el color exacto sin pasar por el compositor. Y como el
 * recorte ya lleva su fondo igualado al del plato por balance de blancos, la
 * unión no necesita difuminado: no hay dos tonos que fundir.
 */

// Solo la Crema Anti-Estrías sigue saliendo de GA9: es el único envase sin
// packshot de estudio propio. Los demás se generan más abajo a partir de los
// originales sobre fondo blanco, que son mejores en todo.
const FROM_GA9 = PACKSHOTS.filter((c) => c.slug === 'crema-anti-estrias');

for (const c of FROM_GA9) {
  const { width: CW, height: CH } = PACKSHOT_CANVAS;
  const ratio = PACKSHOT_SCALE[c.slug] ?? 0.75;

  const h = Math.round(CH * ratio);
  const w = Math.round(h * (c.width / c.height));
  const top = Math.round(CH * PACKSHOT_BASELINE) - h;
  const left = Math.round((CW - w) / 2);

  // Ajuste de balance de blancos: lleva el fondo propio del recorte al color
  // exacto del plato. Es un factor por canal de como mucho un 4 %, aplicado por
  // igual a toda la imagen — la misma corrección que haría un fotógrafo de
  // producto para homogeneizar una serie. No altera el contenido de la etiqueta.
  const bg = BACKGROUNDS.get(c.slug);
  const gain = [0, 1, 2].map((i) => TARGET[i] / bg[i]);

  /*
   * El lienzo se monta a nivel de PÍXEL, no con `composite` ni con `extend`.
   *
   * Ninguno de los dos escribe el color que se les pide:
   *   · `composite` desplaza TODO el lienzo un factor 0,91 (mide: un plato de
   *     rgb(231,160,163) sale rgb(210,146,149)) porque compone en luz lineal.
   *   · `extend` tampoco escribe el literal, y el resultado varía según la
   *     imagen de partida: los siete productos acababan con fondos distintos
   *     entre sí — exactamente lo contrario del objetivo.
   *
   * Rellenando el búfer a mano el color queda garantizado byte a byte, y los
   * siete packshots comparten un fondo idéntico de verdad.
   */
  const balanced = await sharp(GA9)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .linear(gain, [0, 0, 0])
    .toBuffer();

  const cropRaw = await sharp(balanced)
    .resize(w, h, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer();

  const canvas = Buffer.alloc(CW * CH * 3);
  for (let i = 0; i < CW * CH; i += 1) {
    canvas[i * 3] = PLATE_COLOR.r;
    canvas[i * 3 + 1] = PLATE_COLOR.g;
    canvas[i * 3 + 2] = PLATE_COLOR.b;
  }

  /*
   * Fondo continuado desde el borde del recorte.
   *
   * El intento anterior fundía el recorte contra un plato liso. No bastaba: el
   * ciclorama de GA9 tiene degradado, así que igualar la MEDIA del fondo dejaba
   * el interior del recorte a un tono distinto del plato y el rectángulo de la
   * foto seguía adivinándose dentro del tile — más aún con el lienzo cuadrado,
   * que deja más plato a la vista.
   *
   * PROBADO Y DESCARTADO: continuar el fondo replicando el píxel de borde del
   * recorte. En teoría no deja costura; en la práctica los recortes son
   * ajustados y sus bordes contienen píxeles del envase, así que la replicación
   * los arrastraba en estelas horizontales y verticales alrededor de cada
   * producto. Mucho peor que el rectángulo que pretendía resolver.
   *
   * Se queda la rampa asimétrica: ancha por los lados y por arriba, donde solo
   * hay fondo que fundir; estrecha por abajo, donde está la base del envase y su
   * sombra — si se difumina ahí, el producto parece flotar en vez de apoyarse.
   *
   * Queda un rectángulo muy tenue, inherente a recortar productos de una única
   * foto de grupo con ciclorama en degradado. Solo lo elimina del todo una
   * sesión de packshot sobre fondo neutro.
   */
  const RAMP = { left: 70, right: 70, top: 50, bottom: 20 };
  const smooth = (t) => t * t * (3 - 2 * t);

  for (let y = 0; y < h; y += 1) {
    const fy = Math.min(y / RAMP.top, (h - 1 - y) / RAMP.bottom, 1);

    for (let x = 0; x < w; x += 1) {
      const fx = Math.min(x / RAMP.left, (w - 1 - x) / RAMP.right, 1);
      const alpha = smooth(Math.max(0, Math.min(1, Math.min(fx, fy))));

      const s = (y * w + x) * 3;
      const d = ((top + y) * CW + left + x) * 3;

      canvas[d] = Math.round(PLATE_COLOR.r + (cropRaw[s] - PLATE_COLOR.r) * alpha);
      canvas[d + 1] = Math.round(PLATE_COLOR.g + (cropRaw[s + 1] - PLATE_COLOR.g) * alpha);
      canvas[d + 2] = Math.round(PLATE_COLOR.b + (cropRaw[s + 2] - PLATE_COLOR.b) * alpha);
    }
  }

  await emit(
    sharp(canvas, { raw: { width: CW, height: CH, channels: 3 } }),
    `${OUT_DIR}/products/${c.slug}.jpg`,
    `product.${c.slug}`,
  );

  if (c.width < PDP_COMFORTABLE_WIDTH) thin.push(`${c.slug} (${c.width}px)`);
}

if (thin.length > 0) {
  console.log(
    `\n  ⚠ Por debajo de ${PDP_COMFORTABLE_WIDTH}px de ancho — necesitan fotografía propia:\n    ${thin.join('\n    ')}`,
  );
}

/* ---------------------------------------------------------------------------
   Packshots de estudio
   ---------------------------------------------------------------------------
   Cada original viene con el envase centrado sobre blanco y con mucho margen.
   Se recorta al contenido real (`trim`), se reescala al tamaño óptico que le
   toca y se coloca sobre un lienzo cuadrado, con la base siempre en la misma
   línea. Al ser el fondo del lienzo el mismo blanco del original, no hay
   ninguna costura que disimular.
   --------------------------------------------------------------------------- */
console.log('\n── Packshots de estudio ──────────────────────────────────────────');

const { width: SW, height: SH } = PACKSHOT_CANVAS;

/** Línea de apoyo común: donde se apoya la BASE del envase, no el reflejo. */
const STUDIO_BASELINE = Math.round(SH * 0.8);

/** Reflejo conservado, como fracción de la altura del envase. */
const REFLECTION = 0.22;

/**
 * Fila en la que se apoya el envase.
 *
 * Recorriendo de abajo arriba, la primera fila que contiene píxeles claramente
 * oscuros es la base: el reflejo es siempre más claro que el producto.
 *
 * Hace falta porque los reflejos de estos originales miden entre el 13 % y el
 * 49 % de la caja recortada. Alineando por el borde inferior del recorte se
 * alineaban los reflejos y las bases quedaban a alturas distintas, que es justo
 * lo contrario del punto de apoyo común.
 */
async function productBase(buffer) {
  const { data, info } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });

  for (let y = info.height - 1; y >= 0; y -= 1) {
    let min = 255;
    for (let x = 0; x < info.width; x += 1) {
      const v = data[y * info.width + x];
      if (v < min) min = v;
    }
    if (min < 110) return y;
  }

  return info.height - 1;
}

for (const p of STUDIO_PACKSHOTS) {
  const src = path.join(STUDIO_DIR, p.file);

  // `trim` deja la caja real del envase con su reflejo, sin el margen blanco.
  const trimmed = await sharp(src).trim({ threshold: 12 }).toBuffer();
  const meta = await sharp(trimmed).metadata();

  const base = await productBase(trimmed);
  const productH = base + 1;
  const keep = Math.min(meta.height - productH, Math.round(productH * REFLECTION));

  const cut = await sharp(trimmed)
    .extract({ left: 0, top: 0, width: meta.width, height: productH + keep })
    .toBuffer();

  // La escala se toma del ENVASE, nunca de la caja con reflejo.
  const scale =
    p.fit === 'height' ? (SH * p.size) / productH : (SW * p.size) / meta.width;

  const w = Math.max(1, Math.round(meta.width * scale));
  const totalH = Math.max(1, Math.round((productH + keep) * scale));
  const top = STUDIO_BASELINE - Math.round(productH * scale);
  const left = Math.round((SW - w) / 2);

  await emit(
    sharp(cut)
      .resize(w, totalH, { fit: 'fill' })
      .extend({
        top,
        bottom: SH - top - totalH,
        left,
        right: SW - left - w,
        background: STUDIO_BACKGROUND,
      })
      .flatten({ background: STUDIO_BACKGROUND }),
    // Nombre versionado: evita que el optimizador de Next o un CDN conserve
    // el antiguo recorte rosa de GA9 bajo la misma URL.
    `${OUT_DIR}/products/${p.slug}-studio.jpg`,
    `product.${p.slug}`,
  );
}

for (const p of LIFESTYLE_PACKSHOTS) {
  const src = path.join(STUDIO_DIR, p.file);
  const meta = await sharp(src).metadata();
  const region = focalCrop(meta.width, meta.height, 1, p.focal);

  await emit(
    sharp(src).extract(region).resize(SW, SH, { fit: 'fill' }).flatten({ background: '#ffffff' }),
    `${OUT_DIR}/products/${p.slug}-studio.jpg`,
    `product.${p.slug}`,
  );
}

console.log('\n── Colección completa ────────────────────────────────────────────');
await derive('GA9.jpg', 'collection.all', `${OUT_DIR}/editorial/coleccion-completa.jpg`, 2000);

await writeFile(
  path.join(OUT_DIR, 'image-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  'utf8',
);

console.log(`\n✓ ${Object.keys(manifest).length} derivados generados`);
console.log(`✓ Manifiesto en ${OUT_DIR}/image-manifest.json\n`);
