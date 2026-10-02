'use server';

import { createHash, createHmac } from 'node:crypto';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { rateLimitEmailKey, requestIp } from '@/lib/security/rate-limit-keys';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { backInStockSchema, newsletterSchema } from '@/lib/validation/subscriptions';
import { isLocale, pick, type Locale } from '@/lib/i18n';

/**
 * Altas de novedades y de avisos de reposición.
 *
 * Ninguna de las dos manda correo al darse de alta. Es deliberado: el registro
 * de cuentas sí lo hacía, y en septiembre de 2026 eso convirtió a unos bots en
 * un cañón de correos no pedidos contra personas reales (ver
 * `rate-limit-keys.ts`). Aquí una dirección ajena escrita por un bot solo deja
 * una fila; el único correo posible es el aviso de reposición, uno y cuando
 * de verdad vuelve el producto.
 *
 * Una dirección ya apuntada recibe la misma confirmación que una nueva: así
 * el formulario no sirve para averiguar quién está en la lista.
 */

export interface SubscriptionState {
  readonly status?: 'success' | 'error';
  readonly message?: string;
}

function privateHash(value: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret
    ? createHmac('sha256', secret).update(value).digest('hex')
    : createHash('sha256').update(value).digest('hex');
}

function langOf(formData: FormData): Locale {
  const raw = String(formData.get('lang') ?? '');
  return isLocale(raw) ? raw : 'es';
}

/** Por IP y por buzón real: ni una IP ni una dirección con puntos lo esquivan. */
async function allowed(scope: string, email: string, ipHash: string | null): Promise<boolean> {
  const byEmail = await checkRateLimit(`${scope}:email:${rateLimitEmailKey(email)}`, 3, 3600);
  if (!byEmail) return false;
  return ipHash ? checkRateLimit(`${scope}:ip:${ipHash}`, 10, 3600) : true;
}

async function clientIpHash(): Promise<string | null> {
  const ip = await requestIp();
  return ip === 'unknown' ? null : privateHash(ip);
}

const TOO_MANY = (lang: Locale) =>
  pick(lang, 'Too many attempts. Please wait an hour and try again.', 'Demasiados intentos. Espera una hora e inténtalo de nuevo.');
const INVALID_EMAIL = (lang: Locale) =>
  pick(lang, 'Enter a valid email.', 'Escribe un correo válido.');
const FAILED = (lang: Locale) =>
  pick(lang, 'We could not save your email. Please try again.', 'No pudimos guardar tu correo. Inténtalo de nuevo.');

export async function subscribeNewsletter(
  _previous: SubscriptionState,
  formData: FormData,
): Promise<SubscriptionState> {
  const lang = langOf(formData);
  const done: SubscriptionState = {
    status: 'success',
    message: pick(lang, "You're in. We'll write when there's something worth telling.", 'Listo. Te escribiremos cuando haya algo que valga la pena contarte.'),
  };

  // Campo señuelo: invisible para una persona. El bot recibe la misma respuesta.
  if (String(formData.get('company') ?? '').trim()) return done;

  const parsed = newsletterSchema.safeParse({ email: formData.get('email'), lang });
  if (!parsed.success) return { status: 'error', message: INVALID_EMAIL(lang) };

  const ipHash = await clientIpHash();
  if (!(await allowed('newsletter', parsed.data.email, ipHash))) {
    return { status: 'error', message: TOO_MANY(lang) };
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('newsletter_subscribers').insert({
    email: parsed.data.email,
    source: `home:${lang}`,
    ip_hash: ipHash,
  });

  if (error?.code === '23505') {
    // Ya estaba. Si se había dado de baja, volver a escribir su correo es una
    // nueva alta explícita; si sigue suscrita, no hay nada que cambiar.
    await admin
      .from('newsletter_subscribers')
      .update({ status: 'subscribed', unsubscribed_at: null, subscribed_at: new Date().toISOString() })
      .eq('email', parsed.data.email)
      .eq('status', 'unsubscribed');
    return done;
  }

  if (error) {
    console.error('[newsletter] failed to save subscriber:', error.code);
    return { status: 'error', message: FAILED(lang) };
  }

  return done;
}

export async function requestBackInStock(
  _previous: SubscriptionState,
  formData: FormData,
): Promise<SubscriptionState> {
  const lang = langOf(formData);
  const done: SubscriptionState = {
    status: 'success',
    message: pick(lang, "Done. We'll email you once, as soon as it's back.", 'Listo. Te escribiremos una sola vez, en cuanto vuelva.'),
  };

  if (String(formData.get('company') ?? '').trim()) return done;

  const parsed = backInStockSchema.safeParse({
    email: formData.get('email'),
    slug: formData.get('slug'),
    lang,
  });
  if (!parsed.success) return { status: 'error', message: INVALID_EMAIL(lang) };

  const ipHash = await clientIpHash();
  if (!(await allowed('back-in-stock', parsed.data.email, ipHash))) {
    return { status: 'error', message: TOO_MANY(lang) };
  }

  const admin = createAdminSupabaseClient();
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', parsed.data.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!product) return { status: 'error', message: FAILED(lang) };

  const { error } = await admin.from('back_in_stock_requests').insert({
    product_id: product.id,
    email: parsed.data.email,
    locale: lang,
    ip_hash: ipHash,
  });

  // 23505: ya tenía un aviso abierto para este producto. Mismo resultado.
  if (error && error.code !== '23505') {
    console.error('[back-in-stock] failed to save request:', error.code);
    return { status: 'error', message: FAILED(lang) };
  }

  return done;
}
