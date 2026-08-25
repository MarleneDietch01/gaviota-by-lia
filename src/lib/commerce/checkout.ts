import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getProductBySlug } from '@/lib/catalog/products';
import { cents, type Cents } from '@/lib/commerce/money';
import type { Locale } from '@/lib/i18n';
import { checkoutLinesSchema } from '@/lib/validation/checkout';
import type { Database } from '@/types/database.types';

export interface CheckoutItem {
  readonly slug: string;
  readonly name: string;
  readonly unitPrice: Cents;
  readonly quantity: number;
  readonly imageUrl: string;
}

export interface CheckoutValidationResult {
  readonly items: readonly CheckoutItem[];
  readonly subtotal: Cents;
}

/**
 * Valida y resuelve las líneas del carrito contra el catálogo del SERVIDOR.
 *
 * Compartido entre Stripe y PayPal a propósito: es la única función que
 * decide qué se cobra. Si algún día se añade un tercer proveedor, valida
 * exactamente igual — no hay una segunda copia de esta lógica que se pueda
 * desincronizar de la primera.
 */
export async function validateCheckoutLines(
  rawLines: unknown,
  locale: Locale,
): Promise<{ ok: true; result: CheckoutValidationResult } | { ok: false; error: string; slugs?: string[] }> {
  const parseResult = checkoutLinesSchema.safeParse(rawLines);
  if (!parseResult.success) {
    return { ok: false, error: 'invalid_lines' };
  }

  const parsed = parseResult.data;

  const resolved = await Promise.all(
    parsed.map(async (line) => ({ line, product: await getProductBySlug(line.slug, locale) })),
  );

  const missing = resolved.filter((r) => !r.product);
  if (missing.length > 0) {
    return { ok: false, error: 'unknown_product', slugs: missing.map((m) => m.line.slug) };
  }

  // Un producto en cero no puede comprarse. `stockAvailable === null` significa
  // "sin control de inventario" (siempre comprable); cualquier otro valor debe
  // cubrir la cantidad pedida. Esta es la comprobación de servidor que faltaba:
  // hasta esta migración, `Product` no traía dato de stock, así que ningún
  // punto del checkout podía rechazar un producto agotado.
  const outOfStock = resolved.filter(
    ({ line, product }) => product!.stockAvailable !== null && product!.stockAvailable < line.quantity,
  );
  if (outOfStock.length > 0) {
    return { ok: false, error: 'out_of_stock', slugs: outOfStock.map((m) => m.line.slug) };
  }

  const items: CheckoutItem[] = resolved.map(({ line, product }) => ({
    slug: line.slug,
    name: product!.name,
    unitPrice: product!.price,
    quantity: line.quantity,
    imageUrl: product!.image,
  }));

  const subtotal = cents(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));

  return { ok: true, result: { items, subtotal } };
}

export interface ShippingResult {
  readonly shippingCents: Cents;
  /** Para que el proveedor de pago pueda mostrar "Free shipping" en vez de $0. */
  readonly freeShippingApplied: boolean;
}

/**
 * Lee `SHIPPING_FLAT_RATE_CENTS` del entorno. Lanza si no es un entero válido
 * — a propósito: no hay ningún número por defecto porque nadie ha aprobado
 * uno todavía (ver la conversación en `SHIPPING_TODO.md`). Un checkout que
 * falla con un error claro es preferible a uno que cobra un envío inventado.
 */
function fallbackFlatShippingCents(): Cents {
  const raw = process.env.SHIPPING_FLAT_RATE_CENTS;
  const value = raw ? Number(raw) : NaN;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      'Ninguna tarifa de envío configurada: shipping_rates está vacía y ' +
        'SHIPPING_FLAT_RATE_CENTS no tiene un valor entero válido en el entorno. ' +
        'No se inventa un número — confirma la tarifa real con la propietaria y ' +
        'configura SHIPPING_FLAT_RATE_CENTS (o una fila en shipping_rates) antes de aceptar pedidos.',
    );
  }
  return cents(value);
}

/**
 * Lee `FREE_SHIPPING_THRESHOLD_CENTS` del entorno. `undefined` = desactivado
 * (comportamiento por defecto): no se inventa un umbral de envío gratis.
 */
function fallbackFreeShippingThresholdCents(): Cents | null {
  const raw = process.env.FREE_SHIPPING_THRESHOLD_CENTS;
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('FREE_SHIPPING_THRESHOLD_CENTS tiene un valor inválido en el entorno (debe ser un entero positivo en centavos).');
  }
  return cents(value);
}

export interface ShippingConfig {
  readonly rateCents: Cents;
  readonly freeAboveCents: Cents | null;
}

/**
 * Resuelve la tarifa de envío y el umbral de envío gratis vigentes, SIEMPRE
 * en servidor.
 *
 * Prioridad: una fila activa de `shipping_rates` (EE. UU., sin estado
 * específico, sin recogida local) manda sobre todo lo demás — trae su propia
 * tarifa y su propio umbral de envío gratis (`free_above`). Si la tabla está
 * vacía (hoy lo está: 0 filas en producción), cae a las constantes de
 * entorno de arriba. Esto permite pasar a tarifas reales gestionadas desde
 * una fila de base de datos más adelante sin tocar código — hoy no se
 * construye ningún selector de zonas, solo el punto de entrada para uno.
 *
 * Compartida entre el cálculo real del checkout (`computeShipping`) y
 * cualquier mensaje de cara al cliente (barra de progreso del carrito,
 * anuncio del sitio): así el umbral que se muestra es SIEMPRE el mismo que
 * el que se cobra, sin una segunda copia del número que se pueda
 * desincronizar.
 */
export async function getShippingConfig(admin: SupabaseClient<Database>): Promise<ShippingConfig> {
  const { data: rateRow } = await admin
    .from('shipping_rates')
    .select('rate, free_above')
    .eq('country', 'US')
    .is('state', null)
    .eq('status', 'active')
    .eq('is_local_pickup', false)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    rateCents: rateRow ? cents(rateRow.rate) : fallbackFlatShippingCents(),
    freeAboveCents: rateRow
      ? rateRow.free_above !== null
        ? cents(rateRow.free_above)
        : null
      : fallbackFreeShippingThresholdCents(),
  };
}

/**
 * Calcula el costo de envío para un subtotal, SIEMPRE en servidor.
 */
export async function computeShipping(
  admin: SupabaseClient<Database>,
  subtotal: Cents,
): Promise<ShippingResult> {
  const { rateCents, freeAboveCents } = await getShippingConfig(admin);

  if (freeAboveCents !== null && subtotal >= freeAboveCents) {
    return { shippingCents: cents(0), freeShippingApplied: true };
  }

  return { shippingCents: rateCents, freeShippingApplied: false };
}

/**
 * Crea el pedido `pending_payment` + sus líneas + el registro de pago, en
 * Supabase, antes de hablar con el proveedor de pago.
 *
 * `grand_total = subtotal + shipping` — sin descuentos ni impuestos todavía
 * en el MVP (esos los calcula Stripe Tax por su cuenta y no pasan por esta
 * columna; ver `LEGAL_TODO.md` L10 para descuentos). La restricción
 * `totals_add_up` de la base de datos (`grand_total = subtotal - discount_total
 * + tax_total + shipping_total`) rechaza el insert si esta cuenta no cuadra —
 * es la verificación real, esto solo tiene que dejarle los números correctos.
 * `variant_id` queda sin asignar a propósito: no hay inventario real todavía
 * (`CONTENT_TODO.md` C6), así que `reserve_inventory()`/`commit_inventory_sale()`
 * no tienen nada que hacer con estas líneas — no es un olvido, es el estado
 * explícito "sin control de inventario" que el propio esquema ya contempla.
 */
export async function createPendingOrder(
  admin: SupabaseClient<Database>,
  params: {
    email: string;
    items: readonly CheckoutItem[];
    subtotal: Cents;
    shipping: Cents;
    provider: 'stripe' | 'paypal';
    idempotencyKey: string;
  },
): Promise<{ orderId: string; orderNumber: string; grandTotal: Cents } | { error: string }> {
  const grandTotal = cents(params.subtotal + params.shipping);

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_email: params.email || 'sin-correo@pendiente.gaviotabylia.com',
      currency: 'USD',
      subtotal: params.subtotal,
      shipping_total: params.shipping,
      grand_total: grandTotal,
      payment_status: 'pending',
      order_status: 'pending_payment',
      reservation_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return { error: 'order_creation_failed' };
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    params.items.map((item) => ({
      order_id: order.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
    })),
  );

  if (itemsError) {
    return { error: 'order_items_failed' };
  }

  const { error: paymentError } = await admin.from('payments').insert({
    order_id: order.id,
    provider: params.provider,
    idempotency_key: params.idempotencyKey,
    amount: grandTotal,
    currency: 'USD',
    status: 'pending',
  });

  if (paymentError) {
    return { error: 'payment_record_failed' };
  }

  return { orderId: order.id, orderNumber: order.order_number, grandTotal };
}
