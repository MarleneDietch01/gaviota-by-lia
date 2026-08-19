/**
 * Puesta en marcha del proyecto Supabase de la clienta.
 *
 *   npm run db:setup
 *
 * Hace, en orden:
 *   1. Enlaza el proyecto            (supabase link)
 *   2. Aplica las 18 migraciones     (supabase db push)
 *   3. Recupera las claves de API y las escribe en .env.local
 *   4. Genera los tipos TypeScript reales
 *
 * Lee SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN y SUPABASE_DB_PASSWORD de
 * .env.local. Nunca imprime ninguno de los tres.
 */
import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

config({ path: '.env.local' });

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

const missing = [
  !ref || ref.includes('PEGA') ? 'SUPABASE_PROJECT_REF' : null,
  !token || token.includes('PEGA') ? 'SUPABASE_ACCESS_TOKEN' : null,
  !dbPassword || dbPassword.includes('PEGA') ? 'SUPABASE_DB_PASSWORD' : null,
].filter(Boolean);

if (missing.length > 0) {
  console.error(`Faltan valores en .env.local:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const env = { ...process.env, SUPABASE_ACCESS_TOKEN: token };
const run = (args, opts = {}) =>
  execFileSync('npx', ['supabase', ...args], {
    env,
    encoding: 'utf8',
    stdio: opts.capture ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
  });

console.log('\n1/4  Enlazando el proyecto…');
run(['link', '--project-ref', ref, '--password', dbPassword]);

console.log('\n2/4  Aplicando migraciones…');
run(['db', 'push', '--password', dbPassword]);

console.log('\n3/4  Recuperando claves de API…');
const keysJson = run(['projects', 'api-keys', '--project-ref', ref, '--output', 'json'], {
  capture: true,
});
const keys = JSON.parse(keysJson);
const find = (...names) => keys.find((k) => names.includes(k.name))?.api_key ?? '';

const anon = find('anon', 'publishable');
const service = find('service_role', 'secret');

if (!anon || !service) {
  console.error('No se pudieron leer las claves. Claves devueltas:', keys.map((k) => k.name));
  process.exit(1);
}

/*
 * URL de conexión.
 *
 * El host del pooler depende de la REGIÓN del proyecto, así que no se puede
 * fijar a mano: se consulta a la API de gestión. Se usa el pooler de sesión y
 * no la conexión directa porque `db.<ref>.supabase.co` es IPv6-only en los
 * proyectos nuevos, y falla desde redes sin IPv6.
 */
const projectRes = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!projectRes.ok) {
  console.error(`No se pudo consultar el proyecto (HTTP ${projectRes.status}). ¿Es correcto el token?`);
  process.exit(1);
}

const project = await projectRes.json();
const region = project.region ?? 'us-east-1';
console.log(`    región: ${region}`);

const dbUrl =
  `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}` +
  `@aws-0-${region}.pooler.supabase.com:5432/postgres`;

let envFile = await readFile('.env.local', 'utf8');
const setVar = (name, value) =>
  (envFile = envFile.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${value}`));

setVar('NEXT_PUBLIC_SUPABASE_URL', `https://${ref}.supabase.co`);
setVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', anon);
setVar('SUPABASE_SERVICE_ROLE_KEY', service);
setVar('DATABASE_URL', dbUrl);

await writeFile('.env.local', envFile, 'utf8');
console.log('    ✓ Claves escritas en .env.local');

console.log('\n4/4  Generando tipos TypeScript…');
const types = run(['gen', 'types', 'typescript', '--project-id', ref], { capture: true });
await writeFile('src/types/database.types.ts', types, 'utf8');
console.log('    ✓ src/types/database.types.ts');

console.log('\nListo. Siguiente paso:  npm run db:seed && npm run db:test\n');
