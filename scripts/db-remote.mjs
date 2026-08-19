/**
 * Ejecuta SQL contra el proyecto Supabase enlazado.
 *
 *   node scripts/db-remote.mjs seed          -> carga supabase/seed/dev.sql
 *   node scripts/db-remote.mjs test          -> ejecuta las pruebas pgTAP
 *   node scripts/db-remote.mjs sql "SELECT 1"
 *
 * Existe porque `supabase test db` solo apunta al stack LOCAL, y en esta máquina
 * no hay Docker. Contra la nube hay que hablar con Postgres directamente.
 */
import { config } from 'dotenv';
import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL en .env.local. Ejecuta antes: npm run db:setup');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const mode = process.argv[2];

try {
  if (mode === 'seed') {
    const sql = await readFile('supabase/seed/dev.sql', 'utf8');
    await client.query(sql);
    console.log('✓ Seeds de desarrollo cargados');
  } else if (mode === 'test') {
    // pgTAP vive en el esquema `extensions` de Supabase.
    await client.query('create extension if not exists pgtap with schema extensions');

    const dir = 'supabase/tests';
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

    let ok = 0;
    let failed = 0;

    for (const file of files) {
      const sql = await readFile(path.join(dir, file), 'utf8');
      // Cada archivo ya trae su propio begin/rollback.
      const result = await client.query(sql);
      const rows = result.flat ? result : [result];
      const lines = rows
        .flatMap((r) => (r && r.rows ? r.rows : []))
        .map((r) => Object.values(r)[0])
        .filter((v) => typeof v === 'string');

      for (const line of lines) {
        if (line.startsWith('ok ')) ok += 1;
        else if (line.startsWith('not ok ')) {
          failed += 1;
          console.log(`  ✗ ${line}`);
        }
      }
      console.log(`  ${file}`);
    }

    console.log(`\n${failed === 0 ? '✓' : '✗'} pgTAP: ${ok} correctas, ${failed} fallidas`);
    if (failed > 0) process.exitCode = 1;
  } else if (mode === 'sql') {
    const result = await client.query(process.argv[3]);
    console.table(result.rows);
  } else {
    console.error('Uso: node scripts/db-remote.mjs [seed|test|sql "..."]');
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
