/**
 * Crea (o resetea la contraseña de) la cuenta real de administración y la
 * promueve a super_admin.
 *
 *   node scripts/create-admin.mjs <email>
 *
 * Usa el API REST de administración de GoTrue (`/auth/v1/admin/users`) con la
 * service_role key, NO una inserción SQL directa en `auth.users`: GoTrue
 * necesita crear también la fila correspondiente en `auth.identities` (y
 * cualquier otra tabla interna de su esquema) para que el login funcione — una
 * inserción manual en `auth.users` deja al usuario "roto": existe, pero
 * `signInWithPassword` falla con "Database error querying schema".
 *
 * No se usa `@supabase/supabase-js` porque su cliente inicializa Realtime, que
 * requiere WebSocket nativo (Node 22+); esta máquina corre Node 20. `fetch`
 * directo al API REST evita esa dependencia.
 *
 * La promoción a `super_admin` sí es SQL directo (vía `pg`, usando
 * DATABASE_URL): esa tabla es nuestra, no de GoTrue, y `prevent_role_escalation`
 * permite el cambio cuando `auth.uid()` es NULL (conexión de servicio, sin
 * sesión de usuario) — igual que hacen los seeds de desarrollo.
 */
import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

config({ path: '.env.local' });

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/create-admin.mjs <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!url || !serviceKey || !databaseUrl) {
  console.error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DATABASE_URL en .env.local. Ejecuta antes: npm run db:setup',
  );
  process.exit(1);
}

const password = randomBytes(18).toString('base64url'); // 24 chars

const authHeaders = {
  'Content-Type': 'application/json',
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

// ¿Ya existe? El admin API no tiene "get by email" directo; se lista y filtra.
const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, { headers: authHeaders });
if (!listRes.ok) {
  console.error(`No se pudo listar usuarios (HTTP ${listRes.status}). ¿Es correcta SUPABASE_SERVICE_ROLE_KEY?`);
  process.exit(1);
}
const { users } = await listRes.json();
const existing = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

let userId;

if (existing) {
  userId = existing.id;
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!updateRes.ok) {
    console.error('Error reseteando la contraseña:', await updateRes.text());
    process.exit(1);
  }
  console.log(`Usuario ya existía (${userId}). Contraseña reseteada.`);
} else {
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Admin', last_name: 'Gaviota' },
    }),
  });
  if (!createRes.ok) {
    console.error('Error creando el usuario:', await createRes.text());
    process.exit(1);
  }
  const created = await createRes.json();
  userId = created.id;
  console.log(`Usuario creado (${userId}).`);
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(`update public.profiles set role = 'super_admin' where id = $1`, [userId]);
} finally {
  await client.end();
}

console.log('\n=== Credenciales — guárdalas ahora, no se repiten ===');
console.log(`Email:    ${email}`);
console.log(`Password: ${password}`);
console.log('Rol:      super_admin');
console.log('======================================================\n');
