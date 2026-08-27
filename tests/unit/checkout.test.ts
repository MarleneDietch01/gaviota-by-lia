/**
 * Verificación de la matemática de checkout — SOLO LECTURA contra la base
 * real (mismo patrón que `rls.test.ts`: atacar directamente, sin mocks de
 * Supabase). Se salta si faltan las variables de entorno, igual que RLS.
 *
 * `createServerSupabaseClient()` (usada internamente por `getProductBySlug`/
 * `getShippingConfig`) lee `cookies()` de `next/headers`, que fuera de una
 * petición real de Next.js no existe. Se mockea con un jarro de cookies vacío
 * — exactamente lo que ve un visitante anónimo, el caso real que se prueba
 * aquí.
 *
 * DELIBERADAMENTE NO SE PRUEBA `createPendingOrder()`: escribe filas reales en
 * `orders`/`order_items`/`payments`, y `order_status_history` es inmutable
 * (no se puede borrar después, ver el trigger `forbid_mutation()` — el mismo
 * problema que ya contaminó `orders` con pedidos de prueba esta sesión). No
 * se repite ese error. Ver el informe final para la recomendación de probarlo
 * de verdad con una rama de Supabase dedicada.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: () => {},
  }),
}));
// `import 'server-only'` revienta fuera del bundler de Next (que normalmente
// lo sustituye por un no-op al compilar). `checkout.ts`/`products.ts` lo
// importan de verdad, así que hace falta el mismo tipo de sustitución aquí.
vi.mock('server-only', () => ({}));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const canRun = Boolean(SUPABASE_URL && ANON_KEY);
const describeCheckout = canRun ? describe : describe.skip;

/**
 * Mismo cliente anónimo que `rls.test.ts` — sin service_role: leer
 * `products`/`product_variants`/`shipping_rates` de un producto/tarifa
 * activos ya está permitido a `anon` por sus propias políticas RLS
 * (`products_public_read`, `product_variants_public_read`,
 * `shipping_rates_public_read`), que es exactamente lo que un visitante sin
 * sesión puede leer en producción.
 */
function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

describeCheckout('validateCheckoutLines / computeShipping (solo lectura, datos reales)', () => {
  let validateCheckoutLines: typeof import('@/lib/commerce/checkout').validateCheckoutLines;
  let getShippingConfig: typeof import('@/lib/commerce/checkout').getShippingConfig;
  let computeShipping: typeof import('@/lib/commerce/checkout').computeShipping;
  let cents: typeof import('@/lib/commerce/money').cents;

  let lowestStockSlug: string;
  let lowestStockAvailable: number;
  let realBasePriceCents: number;

  beforeAll(async () => {
    // Import dinámico DESPUÉS del `vi.mock` de arriba, para que
    // `next/headers` ya esté sustituido cuando `checkout.ts`/`products.ts`
    // lo importen internamente.
    ({ validateCheckoutLines, getShippingConfig, computeShipping } = await import('@/lib/commerce/checkout'));
    ({ cents } = await import('@/lib/commerce/money'));

    // Datos reales del producto con menos stock disponible hoy — así el
    // umbral de la prueba de "agotado" es siempre válido, sin depender de un
    // número hardcodeado que se desincronice cuando alguien ajuste inventario
    // desde /admin/products.
    const anon = anonClient();
    const { data: variants, error } = await anon
      .from('product_variants')
      .select('stock_quantity, reserved_quantity, products!inner(slug, status, track_inventory)')
      .eq('products.status', 'active')
      .eq('products.track_inventory', true)
      .eq('status', 'active');
    if (error || !variants || variants.length === 0) {
      throw new Error(`No se pudo leer inventario real para preparar la prueba: ${error?.message}`);
    }
    const withAvailable = variants.map((v) => ({
      slug: (v.products as unknown as { slug: string }).slug,
      available: v.stock_quantity - v.reserved_quantity,
    }));
    withAvailable.sort((a, b) => a.available - b.available);
    lowestStockSlug = withAvailable[0]!.slug;
    lowestStockAvailable = withAvailable[0]!.available;

    const { data: product } = await anon.from('products').select('base_price').eq('slug', lowestStockSlug).single();
    realBasePriceCents = product!.base_price;
  });

  it('rechaza un slug que no existe', async () => {
    const result = await validateCheckoutLines([{ slug: 'producto-que-no-existe-xyz', quantity: 1 }], 'en');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('unknown_product');
  });

  it('rechaza una línea con cantidad mayor al stock disponible real', async () => {
    // `checkoutLineSchema` topa la cantidad en 20 — si el producto con menos
    // stock ya tuviera 20+ disponibles, la prueba no podría pedir "uno más"
    // sin violar ese tope. No debería pasar con datos reales de este
    // catálogo, pero se falla con un mensaje claro en vez de dar un falso
    // positivo si algún día sí pasa.
    const requestedQty = lowestStockAvailable + 1;
    expect(requestedQty).toBeLessThanOrEqual(20);

    const result = await validateCheckoutLines([{ slug: lowestStockSlug, quantity: requestedQty }], 'en');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('out_of_stock');
      expect(result.slugs).toContain(lowestStockSlug);
    }
  });

  it('resuelve el precio desde el servidor, nunca desde el cliente', async () => {
    const result = await validateCheckoutLines([{ slug: lowestStockSlug, quantity: 1 }], 'en');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const item = result.result.items[0]!;
      // El precio viene de la fila real de `products`, leída de nuevo aquí
      // de forma independiente — no del array que la función devolvió.
      expect(item.unitPrice).toBe(realBasePriceCents);
      expect(result.result.subtotal).toBe(realBasePriceCents);
    }
  });

  it('el envío gratis se aplica exactamente en el umbral configurado, nunca antes', async () => {
    const anon = anonClient();
    const { freeAboveCents } = await getShippingConfig(anon);

    if (freeAboveCents === null) {
      // Umbral desactivado hoy — documentarlo, no fallar por algo que no es
      // un bug.
      expect(freeAboveCents).toBeNull();
      return;
    }

    const justBelow = await computeShipping(anon, cents(freeAboveCents - 1));
    expect(justBelow.freeShippingApplied).toBe(false);
    expect(justBelow.shippingCents).toBeGreaterThan(0);

    const atThreshold = await computeShipping(anon, cents(freeAboveCents));
    expect(atThreshold.freeShippingApplied).toBe(true);
    expect(atThreshold.shippingCents).toBe(0);
  });
});
