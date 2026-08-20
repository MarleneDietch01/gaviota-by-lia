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

/**
 * Crea el pedido `pending_payment` + sus líneas + el registro de pago, en
 * Supabase, antes de hablar con el proveedor de pago.
 *
 * Sin descuentos/impuestos/envío en el MVP (`grand_total = subtotal`) — ver
 * `LEGAL_TODO.md` L10. `variant_id` queda sin asignar a propósito: no hay
 * inventario real todavía (`CONTENT_TODO.md` C6), así que
 * `reserve_inventory()`/`commit_inventory_sale()` no tienen nada que hacer con
 * estas líneas — no es un olvido, es el estado explícito "sin control de
 * inventario" que el propio esquema ya contempla.
 */
export async function createPendingOrder(
  admin: SupabaseClient<Database>,
  params: {
    email: string;
    items: readonly CheckoutItem[];
    subtotal: Cents;
    provider: 'stripe' | 'paypal';
    idempotencyKey: string;
  },
): Promise<{ orderId: string; orderNumber: string; grandTotal: Cents } | { error: string }> {
  const grandTotal = params.subtotal;

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_email: params.email || 'sin-correo@pendiente.gaviotabylia.com',
      currency: 'USD',
      subtotal: params.subtotal,
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
