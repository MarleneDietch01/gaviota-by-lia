/**
 * Extrae regiones de una captura a resolución real, para juzgar detalle sin la
 * degradación de mirar una página completa reescalada.
 *
 *   node scripts/crop-region.mjs <captura> <dir-salida> <prefijo> <left,top,w,h:nombre> ...
 */
import sharp from 'sharp';
import path from 'node:path';

const [src, out, prefix, ...regions] = process.argv.slice(2);
const meta = await sharp(src).metadata();
console.log(`fuente: ${meta.width}×${meta.height}`);

for (const region of regions) {
  const [box, name] = region.split(':');
  const [l, t, w, h] = box.split(',').map(Number);
  const width = Math.min(w, meta.width - l);
  const height = Math.min(h, meta.height - t);

  await sharp(src)
    .extract({ left: l, top: t, width, height })
    .jpeg({ quality: 88 })
    .toFile(path.join(out, `${prefix}-${name}.jpg`));

  console.log(`  ${name}: ${l},${t} ${width}×${height}`);
}
