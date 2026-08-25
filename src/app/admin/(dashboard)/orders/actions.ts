'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * "Marcar como enviado" — el flujo de despacho que hoy no existe (ver el
 * pedido de la dueña, sección 1b).
 *
 * Escribe en dos sitios en la misma acción:
 *   1. `shipments` (carrier/tracking_number/tracking_url/status/shipped_at) —
 *      la tabla YA EXISTÍA en el esquema (`supabase/migrations/
 *      20260803120009_shipping.sql`), preparada para exactamente este dato.
 *      No hizo falta ninguna migración nueva para 1b.
 *   2. `orders.order_status = 'shipped'` — el trigger de auditoría
 *      (`0017_triggers.sql`) escribe automáticamente en
 *      `order_status_history`; esta acción no inserta ahí a mano.
 *
 * El campo de tracking se guarda aunque todavía no exista el correo de aviso
 * a la clienta (pedido explícito del brief): cuando ese correo se construya,
 * el dato ya está aquí.
 */
const markShippedSchema = z.object({
  orderId: z.uuid(),
  carrier: z.string().trim().min(1, 'La transportadora es obligatoria').max(80),
  trackingNumber: z.string().trim().min(1, 'El número de rastreo es obligatorio').max(120),
  trackingUrl: z.string().trim().url().optional().or(z.literal('')),
});

export async function markOrderShipped(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = markShippedSchema.safeParse({
    orderId: formData.get('orderId'),
    carrier: formData.get('carrier'),
    trackingNumber: formData.get('trackingNumber'),
    trackingUrl: formData.get('trackingUrl') || '',
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos';
    redirect(`/admin/orders/${String(formData.get('orderId') ?? '')}?error=${encodeURIComponent(message)}`);
  }

  const { orderId, carrier, trackingNumber, trackingUrl } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data: existingShipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  const shipmentPayload = {
    order_id: orderId,
    carrier,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl || null,
    status: 'in_transit',
    shipped_at: now,
  };

  const shipmentResult = existingShipment
    ? await supabase.from('shipments').update(shipmentPayload).eq('id', existingShipment.id)
    : await supabase.from('shipments').insert(shipmentPayload);

  if (shipmentResult.error) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(`No se pudo guardar el envío: ${shipmentResult.error.message}`)}`);
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update({ order_status: 'shipped', fulfillment_status: 'shipped' })
    .eq('id', orderId);

  if (orderError) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(`Envío guardado, pero no se pudo actualizar el estado del pedido: ${orderError.message}`)}`);
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin');
  redirect(`/admin/orders/${orderId}?saved=1`);
}

const noteSchema = z.object({
  orderId: z.uuid(),
  internalNotes: z.string().trim().max(2000).optional(),
});

/** Notas internas — no visibles para la clienta, solo para el equipo. */
export async function saveOrderNotes(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = noteSchema.safeParse({
    orderId: formData.get('orderId'),
    internalNotes: formData.get('internalNotes') || undefined,
  });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from('orders')
    .update({ internal_notes: parsed.data.internalNotes ?? null })
    .eq('id', parsed.data.orderId);

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  redirect(`/admin/orders/${parsed.data.orderId}?saved=1`);
}
