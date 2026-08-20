/**
 * Verifica el entorno antes de un build de producción.
 *
 *   node scripts/check-env.mjs
 *
 * Se ejecuta como `prebuild` (ver package.json) — falla ANTES de compilar si
 * falta algo crítico, en vez de dejar que el sitio se despliegue roto (o,
 * peor, funcionando pero cobrando con la clave de prueba equivocada).
 *
 * Nota: `.env.example` menciona `scripts/check-env.ts`. Se implementa en
 * `.mjs` como el resto de `scripts/` (`create-admin.mjs`, `db-remote.mjs`) —
 * Node no ejecuta `.ts` de forma nativa sin un loader, y añadir uno para un
 * único script no compensa.
 *
 * Se engancha como `prebuild` (ver package.json): npm solo dispara ese hook
 * al ejecutar `npm run build`, nunca con `npm run dev` — así que no hace
 * falta comprobar `NODE_ENV` aquí, el propio nombre del script ya acota
 * cuándo corre. (La primera versión sí comprobaba `NODE_ENV === 'production'`
 * y se saltaba a sí misma en local, porque npm no fija esa variable para los
 * hooks `pre*`: solo `next build` la fija, y ya es tarde para entonces.)
 *
 * Para un build de vista previa/staging con claves de prueba a propósito,
 * usa `SKIP_ENV_CHECK=1 npm run build`.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

if (process.env.SKIP_ENV_CHECK === '1') {
  console.log('check-env: SKIP_ENV_CHECK=1 — se omite la verificación.');
  process.exit(0);
}

const problems = [];

function require_(name, message) {
  if (!process.env[name] || process.env[name]?.trim() === '') {
    problems.push(message ?? `Falta ${name}`);
  }
}

function forbid(name, badValues, message) {
  const value = process.env[name];
  if (value && badValues.includes(value)) {
    problems.push(message ?? `${name} tiene un valor de desarrollo: "${value}"`);
  }
}

// --- Supabase: sin esto la app no arranca -----------------------------------
require_('NEXT_PUBLIC_SUPABASE_URL');
require_('NEXT_PUBLIC_SUPABASE_ANON_KEY');
require_('SUPABASE_SERVICE_ROLE_KEY');

// --- Sitio --------------------------------------------------------------------
if (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
  problems.push('NEXT_PUBLIC_SITE_URL sigue en localhost — los redirect_url de Stripe/PayPal y los enlaces de correo saldrán rotos.');
}

// --- Pagos: al menos un proveedor real conectado -----------------------------
forbid('PAYMENT_PROVIDER', ['mock'], 'PAYMENT_PROVIDER sigue en "mock" — es la variable legada, pero su presencia en "mock" es la señal histórica de "no configurado todavía".');

const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
const paypalConfigured = Boolean(
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID,
);

if (!stripeConfigured && !paypalConfigured) {
  problems.push(
    'Ningún proveedor de pago está completamente configurado (Stripe necesita STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET; PayPal necesita NEXT_PUBLIC_PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET + PAYPAL_WEBHOOK_ID).',
  );
}

if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  problems.push('STRIPE_SECRET_KEY es una clave de TEST (sk_test_) en un build de producción.');
}

if (process.env.PAYPAL_ENVIRONMENT !== 'live' && paypalConfigured) {
  problems.push('PAYPAL_ENVIRONMENT no está en "live" en un build de producción (sigue en sandbox).');
}

// --- Seguridad: nada con el valor de ejemplo del repo ------------------------
forbid(
  'CRON_SECRET',
  ['desarrollo_cron_secret_no_usar_en_produccion', ''],
  'CRON_SECRET sigue con el valor de desarrollo.',
);
forbid(
  'ENCRYPTION_KEY',
  ['0000000000000000000000000000000000000000000000000000000000000000'],
  'ENCRYPTION_KEY sigue con el valor de relleno de desarrollo.',
);

// --- Correo transaccional -----------------------------------------------------
if (process.env.EMAIL_FROM?.endsWith('@gmail.com')) {
  problems.push('EMAIL_FROM usa un dominio @gmail.com — Resend no envía desde dominios de correo personal (ver MIGRATION_RISKS.md R14).');
}

if (problems.length > 0) {
  console.error('\ncheck-env: el build de producción NO puede continuar:\n');
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('check-env: entorno de producción correcto.');
