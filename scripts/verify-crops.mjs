/**
 * Genera una hoja de contacto con los packshots candidatos para revisarlos
 * visualmente antes de generar los derivados definitivos.
 *
 *   node scripts/verify-crops.mjs <directorio-de-salida>
 */
import sharp from 'sharp';
import path from 'node:path';
import { PACKSHOTS } from './crops.mjs';

const SRC = 'originales/GA9.jpg';
const OUT = process.argv[2] ?? '.';

const CELL_W = 260;
const CELL_H = 420;
const COLS = 4;

const tiles = await Promise.all(
  PACKSHOTS.map(async (c, i) => ({
    input: await sharp(SRC)
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .resize(CELL_W, CELL_H, { fit: 'contain', background: '#ffffff' })
      .png()
      .toBuffer(),
    left: (i % COLS) * CELL_W,
    top: Math.floor(i / COLS) * CELL_H,
  })),
);

await sharp({
  create: {
    width: CELL_W * COLS,
    height: CELL_H * Math.ceil(PACKSHOTS.length / COLS),
    channels: 3,
    background: '#ffffff',
  },
})
  .composite(tiles)
  .jpeg({ quality: 88 })
  .toFile(path.join(OUT, 'crops-check.jpg'));

console.log('OK →', PACKSHOTS.map((c) => c.slug).join(' | '));
